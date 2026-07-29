import { axiosInstance } from './axiosInstance'
import type {
  DailyReport,
  DailyReportParams,
  MonthlyReport,
  MonthlyReportParams,
  ReportRangeResponse,
  YearlyReport,
  YearlyReportParams,
} from '@/types/reports'

export function getDailyReport(date?: string): Promise<DailyReport>
export function getDailyReport(
  params: DailyReportParams,
): Promise<DailyReport | ReportRangeResponse>
export function getDailyReport(dateOrParams?: string | DailyReportParams) {
  const params =
    typeof dateOrParams === 'string' ? { date: dateOrParams } : dateOrParams
  const isRange = Boolean(params?.from_date && params?.to_date)
  return axiosInstance
    .get<DailyReport | ReportRangeResponse>('/api/reports/daily', { params })
    .then((res) =>
      isRange
        ? (res.data as ReportRangeResponse)
        : (res.data as DailyReport),
    )
}

export function getMonthlyReport(
  year?: number,
  month?: number,
): Promise<MonthlyReport>
export function getMonthlyReport(
  params: MonthlyReportParams,
): Promise<MonthlyReport | ReportRangeResponse>
export function getMonthlyReport(
  yearOrParams?: number | MonthlyReportParams,
  month?: number,
) {
  const params =
    typeof yearOrParams === 'object'
      ? yearOrParams
      : yearOrParams && month
        ? { year: yearOrParams, month }
        : undefined
  const isRange = Boolean(params?.from_month && params?.to_month)
  return axiosInstance
    .get<MonthlyReport | ReportRangeResponse>('/api/reports/monthly', {
      params,
    })
    .then((res) =>
      isRange
        ? (res.data as ReportRangeResponse)
        : (res.data as MonthlyReport),
    )
}

export function getYearlyReport(year?: number): Promise<YearlyReport>
export function getYearlyReport(
  params: YearlyReportParams,
): Promise<YearlyReport | ReportRangeResponse>
export function getYearlyReport(yearOrParams?: number | YearlyReportParams) {
  const params =
    typeof yearOrParams === 'object'
      ? yearOrParams
      : yearOrParams
        ? { year: yearOrParams }
        : undefined
  const isRange = Boolean(params?.from_year && params?.to_year)
  return axiosInstance
    .get<YearlyReport | ReportRangeResponse>('/api/reports/yearly', {
      params,
    })
    .then((res) =>
      isRange
        ? (res.data as ReportRangeResponse)
        : (res.data as YearlyReport),
    )
}
