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

  it('Tez yordam matnini to‘rt tilda saqlaydi', () => {
    expect(uzLatn.exitCandidates.emergency).toBe('Tez yordam')
    expect(uzCyrl.exitCandidates.emergency).toBe('Тез ёрдам')
    expect(ru.exitCandidates.emergency).toBe('Скорая помощь')
    expect(en.exitCandidates.emergency).toBe('Emergency')
  })

  it('Majburiy ochish qidiruv warninglarini to‘rt tilda saqlaydi', () => {
    expect(uzLatn.exitCandidates.forceOpenSearchRequired).toBe(
      'Iltimos, avval, qidiruvni amalga oshiring',
    )
    expect(uzLatn.exitCandidates.forceOpenCorrectPlateRequired).toBe(
      "Iltimos, raqamni to'g'irlab, yana qidiruv qiling",
    )
    expect(uzCyrl.exitCandidates.forceOpenSearchRequired).toBe(
      'Илтимос, аввал, қидирувни амалга оширинг',
    )
    expect(uzCyrl.exitCandidates.forceOpenCorrectPlateRequired).toBe(
      'Илтимос, рақамни тўғрилаб, яна қидирув қилинг',
    )
    expect(ru.exitCandidates.forceOpenSearchRequired).toBe(
      'Пожалуйста, сначала выполните поиск',
    )
    expect(ru.exitCandidates.forceOpenCorrectPlateRequired).toBe(
      'Пожалуйста, исправьте номер и выполните поиск ещё раз',
    )
    expect(en.exitCandidates.forceOpenSearchRequired).toBe(
      'Please perform a search first',
    )
    expect(en.exitCandidates.forceOpenCorrectPlateRequired).toBe(
      'Please correct the plate number and search again',
    )
  })
})
