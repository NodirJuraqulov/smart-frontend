import { describe, expect, it } from 'vitest'
import { API_BASE_URL } from './runtimeBaseUrl'
import { buildMediaUrl } from './media'

describe('buildMediaUrl', () => {
  it('joins relative protected media paths to the resolved runtime base', () => {
    expect(buildMediaUrl('/api/protected/image.jpg')).toBe(
      `${API_BASE_URL}/api/protected/image.jpg`,
    )
    expect(buildMediaUrl('api/protected/image.jpg')).toBe(
      `${API_BASE_URL}/api/protected/image.jpg`,
    )
  })

  it('does not rewrite an explicitly absolute media URL', () => {
    expect(buildMediaUrl('https://cdn.example.com/image.jpg')).toBe(
      'https://cdn.example.com/image.jpg',
    )
  })
})
