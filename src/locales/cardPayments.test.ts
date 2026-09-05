import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('card payment translations', () => {
  it.each([
    ['uz-latn', uzLatn],
    ['uz-cyrl', uzCyrl],
    ['ru', ru],
    ['en', en],
  ])('%s tilida barcha karta matnlari mavjud', (_, locale) => {
    expect(locale.paymentMethod.card).toBeTruthy()
    expect(locale.paymentMethod.cardPaymentStarted).toBeTruthy()
    expect(locale.paymentMethod.cardPaymentSuccess).toBeTruthy()
    expect(locale.paymentMethod.cardPaymentDeclined).toBeTruthy()
    expect(locale.paymentMethod.retryCardPayment).toBeTruthy()
    expect(locale.paymentMethod.cardPaymentPending).toBeTruthy()
    expect(locale.paymentMethod.retryCardHint).toBeTruthy()
    expect(locale.paymentMethod.retryCardError).toBeTruthy()
    expect(locale.paymentMethod.switchToCashOnline).toBeTruthy()
    expect(locale.reports.cardRevenue).toBeTruthy()
    expect(locale.publicDisplay.cardPaymentMethod).toBeTruthy()
    expect(locale.cardTerminalSettings.title).toBeTruthy()
    expect(locale.cardTerminalSettings.enabled).toBeTruthy()
    expect(locale.cardTerminalSettings.disabled).toBeTruthy()
    expect(locale.cardTerminalSettings.ipLabel).toBeTruthy()
    expect(locale.cardTerminalSettings.portLabel).toBeTruthy()
    expect(locale.cardTerminalSettings.terminalIdLabel).toBeTruthy()
    expect(locale.cardTerminalSettings.merchantIdLabel).toBeTruthy()
    expect(locale.cardTerminalSettings.loadError).toBeTruthy()
    expect(locale.cardTerminalSettings.saveError).toBeTruthy()
  })
})
