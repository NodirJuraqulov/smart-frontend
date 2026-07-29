import { describe, expect, it } from 'vitest'
import { resolveRuntimeBaseUrl } from './runtimeBaseUrl'

const origin = 'http://192.168.1.202'

describe('resolveRuntimeBaseUrl', () => {
  it.each([
    ['missing', undefined],
    ['empty', ''],
    ['whitespace', '   '],
    ['same-origin', 'same-origin'],
  ])('%s configuration uses the current browser origin', (_name, value) => {
    expect(resolveRuntimeBaseUrl(value, origin)).toBe(origin)
  })

  it('preserves an explicit absolute development URL', () => {
    expect(resolveRuntimeBaseUrl('http://localhost:5000', origin)).toBe(
      'http://localhost:5000',
    )
  })

  it('normalizes one or more trailing slashes', () => {
    expect(resolveRuntimeBaseUrl('https://api.example.com///', origin)).toBe(
      'https://api.example.com',
    )
  })
})
