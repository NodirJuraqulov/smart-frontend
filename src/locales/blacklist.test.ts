import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('blacklist translations', () => {
  it('to‘rt tilda bir xil va bo‘sh bo‘lmagan kalitlarni saqlaydi', () => {
    const translations = [uzLatn, uzCyrl, ru, en]
    const expectedKeys = Object.keys(uzLatn.blacklist).sort()

    for (const translation of translations) {
      expect(translation.nav.blacklist.trim()).not.toBe('')
      expect(Object.keys(translation.blacklist).sort()).toEqual(expectedKeys)
      for (const value of Object.values(translation.blacklist)) {
        expect(value.trim()).not.toBe('')
      }
    }
  })
})
