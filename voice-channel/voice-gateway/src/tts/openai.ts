import OpenAI from 'openai'
import { config } from '../config'

type Voice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

const LANGUAGE_VOICE_MAP: Record<string, Voice> = {
  'es': 'nova',
  'en': 'alloy',
  'pt': 'echo',
  'fr': 'fable',
  'de': 'onyx',
}

function voiceForLanguage(language: string): Voice {
  const lang = language.split('-')[0]
  return LANGUAGE_VOICE_MAP[lang] ?? 'nova'
}

export class OpenAITTS {
  private client = new OpenAI({ apiKey: config.OPENAI_API_KEY })
  private cancelled = false

  /** Stream PCM audio chunks for the given text */
  async *synthesize(
    text: string,
    language: string,
  ): AsyncGenerator<Buffer, void, unknown> {
    this.cancelled = false

    const response = await this.client.audio.speech.create({
      model: 'tts-1-hd',
      voice: voiceForLanguage(language),
      input: text,
      response_format: 'pcm',
      speed: 1.05,
    })

    const reader = response.body.getReader()

    try {
      while (true) {
        if (this.cancelled) break
        const { done, value } = await reader.read()
        if (done) break
        yield Buffer.from(value)
      }
    } finally {
      reader.releaseLock()
    }
  }

  cancel(): void {
    this.cancelled = true
  }
}

/** Split agent response text into sentence-sized chunks for streaming TTS */
export function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
