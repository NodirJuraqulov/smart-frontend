import { axiosInstance } from './axiosInstance'
import type { DailyReport, MonthlyReport, YearlyReport } from '@/types/reports'

export const getDailyReport = (date?: string) =>
  axiosInstance
    .get<DailyReport>('/api/reports/daily', {
      params: date ? { date } : undefined,
    })
    .then((res) => res.data)

export const getMonthlyReport = (year?: number, month?: number) =>
  axiosInstance
    .get<MonthlyReport>('/api/reports/monthly', {
      params: year && month ? { year, month } : undefined,
    })
    .then((res) => res.data)

export const getYearlyReport = (year?: number) =>
  axiosInstance
    .get<YearlyReport>('/api/reports/yearly', {
      params: year ? { year } : undefined,
    })
    .then((res) => res.data)
