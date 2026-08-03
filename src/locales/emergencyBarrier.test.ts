import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

const keys = [
  'emergencyBarrierButton',
  'emergencyBarrierTitle',
  'emergencyBarrierWarning',
  'emergencyBarrierSharedConfirm',
  'emergencyBarrierSharedConfirmButton',
  'emergencyBarrierDirection',
  'emergencyBarrierReason',
  'emergencyBarrierConfirm',
  'emergencyBarrierOpened',
  'emergencyBarrierFailed',
  'emergencyBarrierUnavailable',
  'emergencyBarrierRequestError',
] as const

describe('emergency barrier translations', () => {
  it('barcha matnlar to‘rt tilda mavjud va bo‘sh emas', () => {
    for (const translation of [uzLatn, uzCyrl, ru, en]) {
      for (const key of keys) {
        expect(translation.operatorDashboard[key].trim()).not.toBe('')
      }
    }
  })
})
