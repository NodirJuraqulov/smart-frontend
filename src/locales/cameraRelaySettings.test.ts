import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('camera relay settings translations', () => {
  it('to‘rt tilda bir xil va bo‘sh bo‘lmagan kalitlarni saqlaydi', () => {
    const translations = [uzLatn, uzCyrl, ru, en]
    const expectedKeys = Object.keys(uzLatn.cameraRelaySettings).sort()

    expect(expectedKeys.length).toBeGreaterThan(0)
    for (const translation of translations) {
      expect(Object.keys(translation.cameraRelaySettings).sort()).toEqual(
        expectedKeys,
      )
      for (const value of Object.values(translation.cameraRelaySettings)) {
        expect(value.trim()).not.toBe('')
      }
    }
  })
})
