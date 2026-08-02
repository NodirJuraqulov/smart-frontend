import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('public display translations', () => {
  it('tort tilda bir xil va bosh bolmagan kalitlarni saqlaydi', () => {
    const translations = [uzLatn, uzCyrl, ru, en]
    const expectedKeys = Object.keys(uzLatn.publicDisplay).sort()

    for (const translation of translations) {
      expect(Object.keys(translation.publicDisplay).sort()).toEqual(
        expectedKeys,
      )
      for (const value of Object.values(translation.publicDisplay)) {
        expect(value.trim()).not.toBe('')
      }
    }
  })

  it('barrier failed va declined matnlarini neytral saqlaydi', () => {
    expect(uzLatn.publicDisplay).toMatchObject({
      barrierFailedTitle: 'Iltimos, kuting',
      barrierFailedDescription: 'Operator sizga yordam bermoqda',
      entryDeclinedMessage: 'Operator yordamida yakunlandi',
      exitDeclinedMessage: 'Operator yordamida yakunlandi',
    })
    expect(uzCyrl.publicDisplay).toMatchObject({
      barrierFailedTitle: 'Илтимос, кутинг',
      barrierFailedDescription: 'Оператор сизга ёрдам бермоқда',
      entryDeclinedMessage: 'Оператор ёрдамида якунланди',
      exitDeclinedMessage: 'Оператор ёрдамида якунланди',
    })
    expect(ru.publicDisplay).toMatchObject({
      barrierFailedTitle: 'Пожалуйста, подождите',
      barrierFailedDescription: 'Оператор уже помогает вам',
      entryDeclinedMessage: 'Завершено с помощью оператора',
      exitDeclinedMessage: 'Завершено с помощью оператора',
    })
    expect(en.publicDisplay).toMatchObject({
      barrierFailedTitle: 'Please wait',
      barrierFailedDescription: 'The operator is assisting you',
      entryDeclinedMessage: 'Completed with operator assistance',
      exitDeclinedMessage: 'Completed with operator assistance',
    })
  })

  it('tolov QR matnlarini tort tilda saqlaydi', () => {
    expect(uzLatn.exitCandidates.onlinePaymentShowCustomer).toBe(
      'Onlayn to‘lov uchun mijozga ko‘rsating',
    )
    expect(uzLatn.publicDisplay).toMatchObject({
      scanOnlinePayment: 'Onlayn to‘lov uchun skanerlang',
      paymentQrAlt: 'To‘lov QR kodi',
    })
    expect(uzCyrl.exitCandidates.onlinePaymentShowCustomer).toBe(
      'Онлайн тўлов учун мижозга кўрсатинг',
    )
    expect(uzCyrl.publicDisplay).toMatchObject({
      scanOnlinePayment: 'Онлайн тўлов учун сканерланг',
      paymentQrAlt: 'Тўлов QR коди',
    })
    expect(ru.exitCandidates.onlinePaymentShowCustomer).toBe(
      'Покажите клиенту для онлайн-оплаты',
    )
    expect(ru.publicDisplay).toMatchObject({
      scanOnlinePayment: 'Отсканируйте для онлайн-оплаты',
      paymentQrAlt: 'QR-код для оплаты',
    })
    expect(en.exitCandidates.onlinePaymentShowCustomer).toBe(
      'Show the customer for online payment',
    )
    expect(en.publicDisplay).toMatchObject({
      scanOnlinePayment: 'Scan for online payment',
      paymentQrAlt: 'Payment QR code',
    })
  })
})
