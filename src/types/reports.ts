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
