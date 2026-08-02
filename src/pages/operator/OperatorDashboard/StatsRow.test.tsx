import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

function renderRow({
  data = dailyReport,
  isLoading = false,
  isError = false,
}: {
  data?: DailyReport | null
  isLoading?: boolean
  isError?: boolean
} = {}) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <StatsRow isLoading={isLoading} isError={isError} data={data ?? undefined} />
    </QueryClientProvider>,
  )
}

describe('StatsRow', () => {
  beforeEach(() => {
    getCapacityMock.mockReset()
  })

  it("sig'im (total) MAVJUD bolsa 'band / sigim' formatida korsatadi (regression)", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow()

    await waitFor(() => expect(screen.getByText('/ 50')).toBeInTheDocument())
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it("sig'im (total) NULL bolsa (cheksiz) FAQAT raqamni korsatadi, qoshimcha belgisiz (regression)", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: null, available: null })
    renderRow()

    expect(await screen.findByText('8')).toBeInTheDocument()
    expect(screen.queryByText(/\//)).not.toBeInTheDocument()
  })

  it("stoyanka TOLGAN bolsa (occupied >= total) alohida rang bilan ajratadi (regression)", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 50, total: 50, available: 0 })
    renderRow({ data: { ...dailyReport, currently_parked: 50 } })

    await waitFor(() => expect(screen.getByText('/ 50')).toBeInTheDocument())
    const value = screen.getByText('50')
    expect(value.closest('.ant-statistic-content-value')).toHaveStyle({
      color: '#d97706',
    })
  })

  it("TOLMAGAN bolsa maxsus rang qollanilmaydi", async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow()

    await waitFor(() => expect(screen.getByText('/ 50')).toBeInTheDocument())
    const value = screen.getByText('8')
    expect(value.closest('.ant-statistic-content-value')).not.toHaveStyle({
      color: '#d97706',
    })
  })

  it('band qiymatni daily reportdan emas capacity endpointidan oladi', async () => {
    getCapacityMock.mockResolvedValue({ occupied: 11, total: 50, available: 39 })
    renderRow({ data: { ...dailyReport, currently_parked: 8 } })

    expect(await screen.findByText('11')).toBeInTheDocument()
    expect(screen.queryByText('8')).not.toBeInTheDocument()
  })

  it('to‘lgan holat uchun backend available qiymatini ustuvor oladi', async () => {
    getCapacityMock.mockResolvedValue({ occupied: 49, total: 50, available: 0 })
    renderRow()

    const value = await screen.findByText('49')
    expect(value.closest('.ant-statistic-content-value')).toHaveStyle({
      color: '#d97706',
    })
  })

  it('to‘rtta statistik card ko‘rsatadi', async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow()

    expect(await screen.findAllByTestId('dashboard-stat-card')).toHaveLength(4)
  })

  it('birinchi card ichida bugungi kirish va chiqishni birga ko‘rsatadi', async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow()

    const activityCard = (
      await screen.findByText('Bugungi harakat')
    ).closest<HTMLElement>('.ant-card')!
    expect(within(activityCard).getByText('Bugun kirdi')).toBeInTheDocument()
    expect(within(activityCard).getByText('10')).toBeInTheDocument()
    expect(within(activityCard).getByText('Bugun chiqdi')).toBeInTheDocument()
    expect(within(activityCard).getByText('4')).toBeInTheDocument()
  })

  it('cash va online revenue qiymatlarini backend reportdan bevosita ko‘rsatadi', async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow()

    expect(await screen.findByText('Naqd to‘lov')).toBeInTheDocument()
    expect(screen.getByText(/30.*000 so'm/)).toBeInTheDocument()
    expect(screen.getByText('Online to‘lov')).toBeInTheDocument()
    expect(screen.getByText(/20.*000 so'm/)).toBeInTheDocument()
    expect(screen.queryByText('Bugungi daromad')).not.toBeInTheDocument()
    expect(screen.queryByText(/50.*000 so'm/)).not.toBeInTheDocument()
  })

  it('loading vaqtida card yoki noto‘g‘ri nol ko‘rsatmaydi', () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow({ isLoading: true })

    expect(screen.queryByTestId('dashboard-stat-card')).not.toBeInTheDocument()
    expect(document.querySelector('.ant-skeleton')).toBeInTheDocument()
  })

  it('daily report xatosida statistik nol qiymatlari o‘rniga error ko‘rsatadi', async () => {
    getCapacityMock.mockResolvedValue({ occupied: 8, total: 50, available: 42 })
    renderRow({ data: null, isError: true })

    expect(
      await screen.findByText('Bugungi statistikani yuklab bo‘lmadi'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('dashboard-stat-card')).not.toBeInTheDocument()
  })
})
