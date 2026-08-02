import { describe, expect, it } from 'vitest'
import {
  PUBLIC_DISPLAY_TRANSIENT_MS,
  getPublicDisplayRemainingMs,
  isTransientPublicDisplayState,
} from './publicDisplayStatus'

describe('public display transient status', () => {
  it('completed va declined holatlarini transient deb belgilaydi', () => {
    expect(isTransientPublicDisplayState('completed')).toBe(true)
    expect(isTransientPublicDisplayState('declined')).toBe(true)
    expect(isTransientPublicDisplayState('barrier_failed')).toBe(false)
  })

  it('ISO timezone offset va millisekundlarni togri hisoblaydi', () => {
    const updatedAt = '2026-08-02T15:00:00.100+05:00'
    const now = Date.parse('2026-08-02T10:00:14.600Z')

    expect(getPublicDisplayRemainingMs(updatedAt, now)).toBe(500)
  })

  it('15 soniyadan eski va notogri vaqtni darhol tugatadi', () => {
    const now = Date.parse('2026-08-02T10:00:15.000Z')

    expect(
      getPublicDisplayRemainingMs('2026-08-02T10:00:00.000Z', now),
    ).toBe(0)
    expect(getPublicDisplayRemainingMs('invalid', now)).toBe(0)
  })

  it('kelajak timestampi transient muddatni uzaytirmaydi', () => {
    const now = Date.parse('2026-08-02T10:00:00.000Z')

    expect(
      getPublicDisplayRemainingMs('2026-08-02T10:00:01.000Z', now),
    ).toBe(PUBLIC_DISPLAY_TRANSIENT_MS)
  })
})
