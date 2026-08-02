import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('candidate translations', () => {
  it.each(['entryCandidates', 'exitCandidates'] as const)(
    '%s to‘rt tilda bir xil va bo‘sh bo‘lmagan kalitlarni saqlaydi',
    (section) => {
    const translations = [uzLatn, uzCyrl, ru, en]
      const expectedKeys = Object.keys(uzLatn[section]).sort()

    expect(expectedKeys.length).toBeGreaterThan(0)
    for (const translation of translations) {
        expect(Object.keys(translation[section]).sort()).toEqual(expectedKeys)
        for (const value of Object.values(translation[section])) {
        expect(value.trim()).not.toBe('')
      }
    }
    },
  )
})
