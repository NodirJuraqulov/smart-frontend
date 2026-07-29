import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  normalizeRangeItems,
  rangeLength,
  safeTotals,
  validateRange,
} from './reportRange'

const now = dayjs('2026-07-29')

describe('report range validation', () => {
  it('accepts same day, month and year as an inclusive one-period range', () => {
    expect(validateRange('daily', [now, now], now)).toBeNull()
    expect(validateRange('monthly', [now, now], now)).toBeNull()
    expect(validateRange('yearly', [now, now], now)).toBeNull()
  })

  it('calculates inclusive daily and cross-year monthly lengths', () => {
    expect(rangeLength('daily', [dayjs('2026-07-01'), dayjs('2026-07-03')])).toBe(3)
    expect(rangeLength('monthly', [dayjs('2025-11-01'), dayjs('2026-02-01')])).toBe(4)
  })

  it('rejects incomplete and reversed ranges', () => {
    expect(validateRange('daily', null, now)).toBe('incomplete')
    expect(validateRange('daily', [dayjs('2026-07-02'), dayjs('2026-07-01')], now)).toBe('order')
  })

  it('enforces inclusive backend limits', () => {
    expect(validateRange('daily', [dayjs('2025-07-29'), now], now)).toBeNull()
    expect(validateRange('daily', [dayjs('2025-07-28'), now], now)).toBe('limit')
    expect(validateRange('monthly', [dayjs('2016-08-01'), now], now)).toBeNull()
    expect(validateRange('monthly', [dayjs('2016-07-01'), now], now)).toBe('limit')
    expect(validateRange('yearly', [dayjs('2007-01-01'), now], now)).toBeNull()
    expect(validateRange('yearly', [dayjs('2006-01-01'), now], now)).toBe('limit')
  })

  it('rejects future periods for every report type', () => {
    expect(validateRange('daily', [now, now.add(1, 'day')], now)).toBe('future')
    expect(validateRange('monthly', [now, now.add(1, 'month')], now)).toBe('future')
    expect(validateRange('yearly', [now, now.add(1, 'year')], now)).toBe('future')
  })
})

describe('range response safety', () => {
  it('uses backend totals and replaces non-finite or missing values with zero', () => {
    const totals = safeTotals({
      total_entries: 0,
      total_revenue: Number.NaN,
    })
    expect(totals.total_entries).toBe(0)
    expect(totals.total_revenue).toBe(0)
    expect(totals.subscription_revenue).toBe(0)
  })

  it('renders zero-valued and legacy item metric names safely', () => {
    const items = normalizeRangeItems('daily', {
      period: { type: 'daily', from: '2026-07-01', to: '2026-07-02' },
      totals: safeTotals({}),
      items: [
        { date: '2026-07-01', total_entries: 0, total_revenue: 0 },
        { date: '2026-07-02', entries: 2, exits: 1, revenue: 5000 },
      ],
    })
    expect(items[0]).toMatchObject({ period: '2026-07-01', entries: 0, revenue: 0 })
    expect(items[1]).toMatchObject({ entries: 2, exits: 1, revenue: 5000 })
    expect(JSON.stringify(items)).not.toMatch(/NaN|Infinity|undefined/)
  })
})
