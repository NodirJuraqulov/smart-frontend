import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DailyReportTab from './DailyReportTab'

const { getDailyReportMock, getExitControlReportMock } = vi.hoisted(() => ({
  getDailyReportMock: vi.fn(),
  getExitControlReportMock: vi.fn(),
}))

vi.mock('@/api/reports', () => ({
  getDailyReport: getDailyReportMock,
  getExitControlReport: getExitControlReportMock,
}))

vi.mock('@/components/SingleSeriesBarChart', () => ({
  default: () => <div data-testid="report-chart" />,
}))

vi.mock('./ReportFilter', () => ({
  default: () => <div data-testid="report-filter" />,
}))

describe('DailyReportTab card revenue', () => {
  beforeEach(() => {
    getDailyReportMock.mockReset().mockResolvedValue({
      org_id: 3,
      date: '2026-09-05',
      total_entries: 10,
      total_exits: 8,
      total_revenue: 42345,
      cash_revenue: 20000,
      online_revenue: 10000,
      card_revenue: 12345,
      currently_parked: 2,
      busiest_hour: 14,
      hourly_breakdown: [],
    })
    getExitControlReportMock.mockReset().mockResolvedValue({
      estimated: true,
      avg_loss_som: 10000,
      days: [],
      totals: {},
    })
  })

  it('backend card_revenue qiymatini hisobot statistikasi sifatida ko‘rsatadi', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <DailyReportTab />
        </AntdApp>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Karta orqali tushum')).toBeInTheDocument()
    expect(screen.getByText(/12.*345 so'm/)).toBeInTheDocument()
  })

  it('asosiy kunlik hisobotdan keyin Chiqish nazorati blokini ko‘rsatadi', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <DailyReportTab />
        </AntdApp>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Chiqish nazorati')).toBeInTheDocument()
  })
})
