import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StatsRow from './StatsRow'
import type { DailyReport } from '@/types/reports'

const { getCapacityMock } = vi.hoisted(() => ({
  getCapacityMock: vi.fn(),
}))

vi.mock('@/api/parking', () => ({
  getCapacity: getCapacityMock,
}))

const dailyReport: DailyReport = {
  org_id: 1,
  date: '2026-07-24',
  total_entries: 10,
  total_exits: 4,
  total_revenue: 50000,
  cash_revenue: 30000,
  online_revenue: 20000,
  currently_parked: 8,
  busiest_hour: 14,
  hourly_breakdown: [],
}

function renderRow(data: DailyReport | undefined = dailyReport) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <StatsRow isLoading={false} data={data} />
    </QueryClientProvider>,
  )
}

describe('StatsRow', () => {
  beforeEach(() => {
    getCapacityMock.mockReset()
  })

  it("sig'im (total) MAVJUD bolsa 'band / sigim' formatida korsatadi (regression)", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50 })
    renderRow()

    await waitFor(() => expect(screen.getByText('/ 50')).toBeInTheDocument())
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it("sig'im (total) NULL bolsa (cheksiz) FAQAT raqamni korsatadi, qoshimcha belgisiz (regression)", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: null })
    renderRow()

    await waitFor(() => expect(getCapacityMock).toHaveBeenCalled())
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
  })

  it("stoyanka TOLGAN bolsa (occupied >= total) alohida rang bilan ajratadi (regression)", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 50, total: 50 })
    renderRow({ ...dailyReport, currently_parked: 50 })

    await waitFor(() => expect(screen.getByText('/ 50')).toBeInTheDocument())
    const value = screen.getByText('50')
    expect(value.closest('.ant-statistic-content-value')).toHaveStyle({
      color: '#d97706',
    })
  })

  it("TOLMAGAN bolsa maxsus rang qollanilmaydi", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50 })
    renderRow()

    await waitFor(() => expect(screen.getByText('/ 50')).toBeInTheDocument())
    const value = screen.getByText('8')
    expect(value.closest('.ant-statistic-content-value')).not.toHaveStyle({
      color: '#d97706',
    })
  })
})
