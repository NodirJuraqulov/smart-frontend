import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

describe('registrator translations', () => {
  it.each([
    ['uz-latn', uzLatn],
    ['uz-cyrl', uzCyrl],
    ['ru', ru],
    ['en', en],
  ])('%s tilida rol va faol sessiya qidiruvi mavjud', (_, locale) => {
    expect(locale.common.roleRegistrator).toBeTruthy()
    expect(locale.sessions.searchPlaceholder).toBeTruthy()
    expect(locale.sessions.activeTab).toBeTruthy()
  })
})
