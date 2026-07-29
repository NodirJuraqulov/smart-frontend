export interface HourlyBreakdownItem {
  hour: number
  entries: number
  revenue: number
}

export interface DailyReport {
  org_id: number
  date: string
  total_entries: number
  total_exits: number
  total_revenue: number
  cash_revenue: number
  online_revenue: number
  currently_parked: number
  busiest_hour: number
  hourly_breakdown: HourlyBreakdownItem[]
}

export interface DailyBreakdownItem {
  date: string
  entries: number
  exits: number
  revenue: number
}

export interface MonthlyReport {
  org_id: number
  year: number
  month: number
  total_entries: number
  total_exits: number
  total_revenue: number
  cash_revenue: number
  online_revenue: number
  daily_breakdown: DailyBreakdownItem[]
}

export interface MonthlyBreakdownItem {
  month: number
  entries: number
  exits: number
  revenue: number
}

export interface YearlyReport {
  org_id: number
  year: number
  total_entries: number
  total_exits: number
  total_revenue: number
  cash_revenue: number
  online_revenue: number
  monthly_breakdown: MonthlyBreakdownItem[]
}

export type ReportType = 'daily' | 'monthly' | 'yearly'

export interface ReportPeriod {
  type: ReportType
  from: string
  to: string
}

export interface ReportTotals {
  total_entries: number
  total_exits: number
  cash_revenue: number
  online_revenue: number
  regular_revenue: number
  subscription_revenue: number
  total_revenue: number
}

export interface ReportRangeItem extends Partial<ReportTotals> {
  date?: string
  month?: string | number
  year?: string | number
  entries?: number
  exits?: number
  revenue?: number
}

export interface ReportRangeResponse<TItem = ReportRangeItem> {
  period: ReportPeriod
  totals: ReportTotals
  items: TItem[]
}

export interface DailyReportParams {
  date?: string
  from_date?: string
  to_date?: string
}

export interface MonthlyReportParams {
  year?: number
  month?: number
  from_month?: string
  to_month?: string
}

export interface YearlyReportParams {
  year?: number
  from_year?: number
  to_year?: number
}
