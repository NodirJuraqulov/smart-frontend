import { describe, expect, it } from 'vitest'
import { formatDate, formatRelativeTime } from '@/utils/format'

describe('formatDate', () => {
  it('togri sanani formatlaydi', () => {
    const result = formatDate('2026-07-18T08:30:00.000Z')
    expect(result).not.toBe('—')
    expect(result).toMatch(/2026/)
  })

  it('null qiymat uchun — qaytaradi', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('undefined qiymat uchun — qaytaradi', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('yaroqsiz sana uchun xato tashlamasdan — qaytaradi', () => {
    expect(() => formatDate('not-a-real-date')).not.toThrow()
    expect(formatDate('not-a-real-date')).toBe('—')
  })
})

describe('formatRelativeTime', () => {
  it('null qiymat uchun — qaytaradi', () => {
    expect(formatRelativeTime(null)).toBe('—')
  })

  it('undefined qiymat uchun — qaytaradi', () => {
    expect(formatRelativeTime(undefined)).toBe('—')
  })

  it('yaroqsiz sana uchun xato tashlamasdan — qaytaradi', () => {
    expect(() => formatRelativeTime('not-a-real-date')).not.toThrow()
    expect(formatRelativeTime('not-a-real-date')).toBe('—')
  })

  it('hozirgina bolgan vaqt uchun "Hozirgina" qaytaradi', () => {
    expect(formatRelativeTime(new Date())).toBe('Hozirgina')
  })

  it('bir necha daqiqa oldingi vaqtni togri hisoblaydi', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 daqiqa oldin')
  })
})
