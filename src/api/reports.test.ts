import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock },
}))

import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
} from './reports'

describe('report API parameters', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ data: {} })
  })

  it('keeps the existing single-day request unchanged', async () => {
    await getDailyReport('2026-07-29')
    expect(getMock).toHaveBeenCalledWith('/api/reports/daily', {
      params: { date: '2026-07-29' },
    })
  })

  it('sends only daily range parameters', async () => {
    await getDailyReport({
      from_date: '2026-07-01',
      to_date: '2026-07-15',
    })
    expect(getMock).toHaveBeenCalledWith('/api/reports/daily', {
      params: { from_date: '2026-07-01', to_date: '2026-07-15' },
    })
  })

  it('keeps the existing single-month request unchanged', async () => {
    await getMonthlyReport(2026, 7)
    expect(getMock).toHaveBeenCalledWith('/api/reports/monthly', {
      params: { year: 2026, month: 7 },
    })
  })

  it('maps a cross-year monthly range exactly', async () => {
    await getMonthlyReport({
      from_month: '2025-11',
      to_month: '2026-02',
    })
    expect(getMock).toHaveBeenCalledWith('/api/reports/monthly', {
      params: { from_month: '2025-11', to_month: '2026-02' },
    })
  })

  it('keeps the existing single-year request unchanged', async () => {
    await getYearlyReport(2026)
    expect(getMock).toHaveBeenCalledWith('/api/reports/yearly', {
      params: { year: 2026 },
    })
  })

  it('serializes yearly range numbers without a single-period field', async () => {
    await getYearlyReport({ from_year: 2024, to_year: 2026 })
    expect(getMock).toHaveBeenCalledWith('/api/reports/yearly', {
      params: { from_year: 2024, to_year: 2026 },
    })
  })
})
