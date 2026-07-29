import dayjs, { type Dayjs } from 'dayjs'
import type {
  ReportRangeItem,
  ReportRangeResponse,
  ReportTotals,
  ReportType,
} from '@/types/reports'

export type FilterMode = 'single' | 'range'
export type DateRange = [Dayjs, Dayjs] | null

export const REPORT_RANGE_LIMITS: Record<ReportType, number> = {
  daily: 366,
  monthly: 120,
  yearly: 20,
}

export function rangeLength(
  type: ReportType,
  [from, to]: [Dayjs, Dayjs],
) {
  const unit = type === 'daily' ? 'day' : type === 'monthly' ? 'month' : 'year'
  return to.startOf(unit).diff(from.startOf(unit), unit) + 1
}

export function validateRange(
  type: ReportType,
  range: DateRange,
  now = dayjs(),
): 'incomplete' | 'order' | 'limit' | 'future' | null {
  if (!range?.[0] || !range[1]) return 'incomplete'
  const [from, to] = range
  if (from.isAfter(to)) return 'order'
  const unit = type === 'daily' ? 'day' : type === 'monthly' ? 'month' : 'year'
  if (from.startOf(unit).isAfter(now.startOf(unit)) || to.startOf(unit).isAfter(now.startOf(unit))) {
    return 'future'
  }
  if (rangeLength(type, range) > REPORT_RANGE_LIMITS[type]) return 'limit'
  return null
}

export const isFuture = (current: Dayjs) =>
  current.startOf('day').isAfter(dayjs().startOf('day'))

export const isFutureMonth = (current: Dayjs) =>
  current.startOf('month').isAfter(dayjs().startOf('month'))

export const isFutureYear = (current: Dayjs) =>
  current.startOf('year').isAfter(dayjs().startOf('year'))

const safeNumber = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function safeTotals(totals: Partial<ReportTotals>): ReportTotals {
  return {
    total_entries: safeNumber(totals.total_entries),
    total_exits: safeNumber(totals.total_exits),
    cash_revenue: safeNumber(totals.cash_revenue),
    online_revenue: safeNumber(totals.online_revenue),
    regular_revenue: safeNumber(totals.regular_revenue),
    subscription_revenue: safeNumber(totals.subscription_revenue),
    total_revenue: safeNumber(totals.total_revenue),
  }
}

export interface RangeViewItem {
  key: string
  period: string
  entries: number
  exits: number
  revenue: number
  cashRevenue: number
  onlineRevenue: number
  regularRevenue: number
  subscriptionRevenue: number
}

export function normalizeRangeItems(
  type: ReportType,
  response?: ReportRangeResponse,
): RangeViewItem[] {
  return (response?.items ?? []).map((item: ReportRangeItem, index) => {
    const period =
      type === 'daily'
        ? item.date
        : type === 'monthly'
          ? item.month
          : item.year
    return {
      key: String(period ?? index),
      period: String(period ?? '—'),
      entries: safeNumber(item.total_entries ?? item.entries),
      exits: safeNumber(item.total_exits ?? item.exits),
      revenue: safeNumber(item.total_revenue ?? item.revenue),
      cashRevenue: safeNumber(item.cash_revenue),
      onlineRevenue: safeNumber(item.online_revenue),
      regularRevenue: safeNumber(item.regular_revenue),
      subscriptionRevenue: safeNumber(item.subscription_revenue),
    }
  })
}
