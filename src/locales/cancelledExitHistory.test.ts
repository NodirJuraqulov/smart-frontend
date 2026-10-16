import { describe, expect, it } from 'vitest'
import uzLatn from './uz-latn/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import ru from './ru/translation.json'
import en from './en/translation.json'

const locales = [uzLatn, uzCyrl, ru, en]

const keys = [
  'cancelledExitTab',
  'cancelledExitColumnTime',
  'cancelledExitColumnConfidence',
  'cancelledExitColumnResolver',
  'cancelledExitColumnImage',
  'cancelledExitEmptyState',
  'cancelledExitImageAlt',
  'cancelledExitLoadError',
  'cancelledExitRetry',
  'cancelledExitRange',
  'cancelledExitStartDate',
  'cancelledExitEndDate',
  'cancelledExitRangeLimit',
] as const

describe('cancelled exit history translations', () => {
  it('tab nomini to‘rt tilda saqlaydi', () => {
    expect(uzLatn.sessions.cancelledExitTab).toBe("Chiqish bo'lmadi")
    expect(uzCyrl.sessions.cancelledExitTab).toBe('Чиқиш бўлмади')
    expect(ru.sessions.cancelledExitTab).toBe('Выезда не было')
    expect(en.sessions.cancelledExitTab).toBe('Not leaving')
  })

  it.each(locales)('barcha yangi kalitlarni saqlaydi', (locale) => {
    for (const key of keys) {
      expect(locale.sessions[key]).toBeTruthy()
    }
  })
})
