import { WebSocket } from 'ws'
import { DeepgramSTT } from './stt/deepgram'
import { OpenAITTS, splitIntoSentences } from './tts/openai'
import { triggerHumanInLoop, closeHilAlert } from './human-loop'
import { db } from './db/client'
import { config } from './config'
import { v4 as uuid } from 'uuid'

interface SessionContext {
  sessionId: string
  phoneNumberId: string
  workspaceId: string
  language: string
  channelNumber: string
  contactPhone: string
  customerId: string
  humanActive: boolean
}

/** Core voice pipeline: STT → Agent → TTS for one call session */
export class VoicePipeline {
  private stt: DeepgramSTT
  private tts = new OpenAITTS()
  private ws: WebSocket
  private ctx: SessionContext
  private transcriptBuffer: Array<{ role: string; content: string }> = []
  private speaking = false
  private processingTurn = false

  constructor(ws: WebSocket, ctx: SessionContext) {
    this.ws = ws
    this.ctx = ctx

    this.stt = new DeepgramSTT(ctx.language, async (event) => {
      if (!event.isFinal) return

      const text = event.text.trim()
      if (!text) return

      // Auto-detect language switch
      if (event.detectedLanguage && event.detectedLanguage !== ctx.language) {
        ctx.language = event.detectedLanguage
        await db.query(
          'UPDATE voice_sessions SET language = $1 WHERE id = $2',
          [ctx.language, ctx.sessionId],
        )
      }

      await this.saveTranscript('user', text, event.audioStartMs, event.audioEndMs)
      await this.handleUserTurn(text)
    })
  }

  async start(): Promise<void> {
    await this.stt.connect()
  }

  handleAudio(pcm: Buffer): void {
    if (!this.ctx.humanActive) {
      this.stt.send(pcm)
    }
  }

  handleInterrupt(): void {
    this.tts.cancel()
    this.speaking = false
  }

  private async handleUserTurn(text: string): Promise<void> {
    if (this.ctx.humanActive) return
    // Prevent a new agent turn from starting while one is in progress
    if (this.processingTurn) return
    this.processingTurn = true

    try {
    // Check for HiL intent (agent engine will decide in production)
    const needsHumanHelp = await this.queryAgentEngine(text)

    if (needsHumanHelp.triggerHumanInLoop) {
      await this.speakAndSave(needsHumanHelp.responseText)
      await this.startHumanInLoop()
      return
    }

    await this.speakAndSave(needsHumanHelp.responseText)
    } finally {
      this.processingTurn = false
    }
  }

  private async queryAgentEngine(
    userText: string,
  ): Promise<{ responseText: string; triggerHumanInLoop: boolean }> {
    const messages = [
      ...this.transcriptBuffer,
      { role: 'user', content: userText },
    ]

    const res = await fetch(`${config.AIMS_AGENT_ENGINE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.AIMS_AGENT_ENGINE_API_KEY}`,
      },
      body: JSON.stringify({
        sessionId: this.ctx.sessionId,
        messages,
        channel: 'voice',
        language: this.ctx.language,
      }),
    })

    if (!res.ok) {
      return {
        responseText: 'I apologize, I am having trouble processing your request. Please hold.',
        triggerHumanInLoop: false,
      }
    }

    return res.json()
  }

  private async speakAndSave(text: string): Promise<void> {
    this.speaking = true
    const sentences = splitIntoSentences(text)
    const fullText = sentences.join(' ')

    await this.saveTranscript('agent', fullText, 0, 0)

    for (const sentence of sentences) {
      for await (const chunk of this.tts.synthesize(sentence, this.ctx.language)) {
        if (!this.speaking) break
        this.sendAudio(chunk)
      }
      if (!this.speaking) break
    }

    this.speaking = false
  }

  private async startHumanInLoop(): Promise<void> {
    const transcriptSoFar = this.transcriptBuffer
      .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
      .join('\n')

    const result = await triggerHumanInLoop(this.ctx.phoneNumberId, {
      sessionId: this.ctx.sessionId,
      customerId: this.ctx.customerId,
      workspaceId: this.ctx.workspaceId,
      channelNumber: this.ctx.channelNumber,
      transcriptSoFar,
    })

    if (result.agentId) {
      this.ctx.humanActive = true
      this.stt.disconnect()
    } else {
      // Fallback
      await this.handleFallback(result.fallback)
    }
  }

  private async handleFallback(fallback: string): Promise<void> {
    if (fallback === 'voicemail') {
      await this.speakAndSave(
        'All our agents are currently busy. Please leave a message after the tone.',
      )
    } else if (fallback === 'queue') {
      await this.speakAndSave(
        'All agents are busy. You are number 1 in queue. Please hold.',
      )
    }
  }

  private sendAudio(chunk: Buffer): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        event: 'media',
        media: { payload: chunk.toString('base64') },
      }))
    }
  }

  private async saveTranscript(
    role: string,
    content: string,
    startMs: number,
    endMs: number,
  ): Promise<void> {
    this.transcriptBuffer.push({ role, content })

    await db.query(
      `INSERT INTO voice_transcripts
         (session_id, role, content, audio_start_ms, audio_end_ms, language)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [this.ctx.sessionId, role, content, startMs, endMs, this.ctx.language],
    )
  }

  async end(): Promise<void> {
    this.tts.cancel()
    await this.stt.disconnect()
    await closeHilAlert(this.ctx.sessionId)

    // Update session sentiment (would call NLP service in production)
    await db.query(
      `UPDATE voice_sessions
       SET status = 'ended', ended_at = NOW()
       WHERE id = $1`,
      [this.ctx.sessionId],
    )
  }
}
