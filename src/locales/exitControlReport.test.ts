import { describe, expect, it } from 'vitest'
import en from './en/translation.json'
import ru from './ru/translation.json'
import uzCyrl from './uz-cyrl/translation.json'
import uzLatn from './uz-latn/translation.json'

const keys = [
  'exitControlTitle',
  'exitControlDay',
  'exitControlNotFound',
  'exitControlForcedOpen',
  'exitControlVipSubscription',
  'exitControlEstimatedLoss',
  'exitControlEstimatedBadge',
  'exitControlEstimateTooltip',
  'exitControlTotal',
  'exitControlLoadError',
  'exitControlRetry',
  'exitControlEmpty',
] as const

describe('exit control report translations', () => {
  it('barcha yangi kalitlarni to‘rt tilda saqlaydi', () => {
    for (const locale of [uzLatn, uzCyrl, ru, en]) {
      for (const key of keys) {
        expect(locale.reports[key]).toBeTruthy()
      }
      expect(locale.exitCandidates.similarity).toBeTruthy()
    }
  })
})
