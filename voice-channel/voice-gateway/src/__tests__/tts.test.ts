import { describe, it, expect } from 'vitest'
import { splitIntoSentences } from '../tts/openai'

describe('splitIntoSentences', () => {
  it('splits on periods', () => {
    const result = splitIntoSentences('Hello. How are you. Fine.')
    expect(result).toEqual(['Hello.', 'How are you.', 'Fine.'])
  })

  it('splits on question marks', () => {
    const result = splitIntoSentences('Are you there? Can I help you?')
    expect(result).toEqual(['Are you there?', 'Can I help you?'])
  })

  it('splits on exclamation marks', () => {
    const result = splitIntoSentences('Welcome! Great to meet you!')
    expect(result).toEqual(['Welcome!', 'Great to meet you!'])
  })

  it('handles mixed punctuation', () => {
    const result = splitIntoSentences('Hello! Are you there? Yes. Great.')
    expect(result).toEqual(['Hello!', 'Are you there?', 'Yes.', 'Great.'])
  })

  it('trims whitespace from each sentence', () => {
    const result = splitIntoSentences('  Hello.   World.  ')
    expect(result).toEqual(['Hello.', 'World.'])
  })

  it('filters empty strings', () => {
    const result = splitIntoSentences('...')
    expect(result.every((s) => s.length > 0)).toBe(true)
  })

  it('returns single sentence without punctuation as-is', () => {
    const result = splitIntoSentences('Hello world')
    expect(result).toEqual(['Hello world'])
  })

  it('handles empty string', () => {
    const result = splitIntoSentences('')
    expect(result).toEqual([])
  })
})
