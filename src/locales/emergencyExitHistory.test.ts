import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('emergency exit history translations', () => {
  it.each([
    ['uz-latn', uzLatn],
    ['uz-cyrl', uzCyrl],
    ['ru', ru],
    ['en', en],
  ])('%s tilida barcha yangi matnlar mavjud', (_, locale) => {
    expect(locale.sessions.forcedOpenColumnEmergency).toBeTruthy()
    expect(locale.sessions.forcedOpenEmergencyYes).toBeTruthy()
    expect(locale.sessions.forcedOpenEmergencyNo).toBeTruthy()
    expect(locale.sessions.emergencyHistoryTab).toBeTruthy()
    expect(locale.sessions.emergencyHistoryColumnResolver).toBeTruthy()
    expect(locale.sessions.emergencyHistoryColumnType).toBeTruthy()
    expect(locale.sessions.emergencyHistoryTypeConfirmed).toBeTruthy()
    expect(locale.sessions.emergencyHistoryTypeForcedOpen).toBeTruthy()
    expect(locale.sessions.emergencyHistoryEmptyState).toBeTruthy()
    expect(locale.sessions.emergencyHistoryImageAlt).toBeTruthy()
  })
})
