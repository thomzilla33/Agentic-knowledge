import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import { config } from '../config'

export interface TranscriptEvent {
  text: string
  isFinal: boolean
  confidence: number
  detectedLanguage?: string
  audioStartMs: number
  audioEndMs: number
}

export type TranscriptHandler = (event: TranscriptEvent) => void

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_MS = 500

export class DeepgramSTT {
  private client = createClient(config.DEEPGRAM_API_KEY)
  private live: ReturnType<typeof this.client.listen.live> | null = null
  private onTranscript: TranscriptHandler
  private language: string
  private audioStartOffset = 0
  private intentionalClose = false
  private reconnectAttempts = 0

  constructor(language: string, onTranscript: TranscriptHandler) {
    this.language = language
    this.onTranscript = onTranscript
  }

  async connect(): Promise<void> {
    this.intentionalClose = false
    this.reconnectAttempts = 0
    await this.openConnection()
  }

  private async openConnection(): Promise<void> {
    this.live = this.client.listen.live({
      model: 'nova-3',
      language: this.language,
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      encoding: 'linear16',
      sample_rate: 16000,
    })

    this.live.on(LiveTranscriptionEvents.Open, () => {
      this.reconnectAttempts = 0
      console.log('[STT] Deepgram connected')
    })

    this.live.on(LiveTranscriptionEvents.Transcript, (data) => {
      const alt = data.channel?.alternatives?.[0]
      if (!alt || !alt.transcript) return

      const startMs = Math.round((alt.words?.[0]?.start ?? 0) * 1000)
      const endMs = Math.round(
        (alt.words?.[alt.words.length - 1]?.end ?? 0) * 1000,
      )

      this.onTranscript({
        text: alt.transcript,
        isFinal: data.is_final ?? false,
        confidence: alt.confidence ?? 1,
        detectedLanguage: data.channel?.detected_language,
        audioStartMs: this.audioStartOffset + startMs,
        audioEndMs: this.audioStartOffset + endMs,
      })
    })

    this.live.on(LiveTranscriptionEvents.Error, (err) => {
      console.error('[STT] Deepgram error:', err)
    })

    this.live.on(LiveTranscriptionEvents.Close, () => {
      if (this.intentionalClose) {
        console.log('[STT] Deepgram connection closed')
        return
      }

      // Unexpected close — attempt exponential backoff reconnection
      if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts)
        this.reconnectAttempts++
        console.warn(`[STT] Unexpected close. Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
        setTimeout(() => {
          this.openConnection().catch((err) =>
            console.error('[STT] Reconnection failed:', err),
          )
        }, delay)
      } else {
        console.error('[STT] Max reconnection attempts reached. Giving up.')
      }
    })
  }

  send(audio: Buffer): void {
    if (this.live?.getReadyState() === 1) {
      this.live.send(audio)
    }
  }

  async disconnect(): Promise<void> {
    this.intentionalClose = true
    this.live?.finish()
    this.live = null
  }
}
