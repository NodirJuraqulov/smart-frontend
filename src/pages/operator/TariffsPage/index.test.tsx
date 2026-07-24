import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import TariffsPage from './index'

const {
  useAppSelectorMock,
  getTariffsMock,
  getTariffIntervalsMock,
  createTariffIntervalMock,
  updateTariffIntervalMock,
  deleteTariffIntervalMock,
} = vi.hoisted(() => ({
  useAppSelectorMock: vi.fn(),
  getTariffsMock: vi.fn(),
  getTariffIntervalsMock: vi.fn(),
  createTariffIntervalMock: vi.fn(),
  updateTariffIntervalMock: vi.fn(),
  deleteTariffIntervalMock: vi.fn(),
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

vi.mock('@/api/tariffs', () => ({
  getTariffs: getTariffsMock,
}))

vi.mock('@/api/organizations', () => ({
  getTariffIntervals: getTariffIntervalsMock,
  createTariffInterval: createTariffIntervalMock,
  updateTariffInterval: updateTariffIntervalMock,
  deleteTariffInterval: deleteTariffIntervalMock,
}))

function renderPage(pricingMode: 'hourly' | 'interval' | undefined) {
  useAppSelectorMock.mockReturnValue(pricingMode)
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <TariffsPage />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('TariffsPage', () => {
  it("pricing_mode 'interval' bolsa tahrirlanadigan IntervalTariffView korsatiladi (regression)", async () => {
    getTariffIntervalsMock.mockResolvedValue([])
    renderPage('interval')

    expect(
      await screen.findByRole('button', { name: /Yangi interval/ }),
    ).toBeInTheDocument()
  })

  it("pricing_mode 'hourly' yoki aniqlanmagan bolsa HourlyTariffCard korsatiladi", () => {
    getTariffsMock.mockResolvedValue([])
    renderPage('hourly')

    expect(
      screen.queryByRole('button', { name: /Yangi interval/ }),
    ).not.toBeInTheDocument()
  })

  it("pricing_mode aniqlanmagan bolsa ham HourlyTariffCard'ga tushadi (default)", () => {
    getTariffsMock.mockResolvedValue([])
    renderPage(undefined)

    expect(
      screen.queryByRole('button', { name: /Yangi interval/ }),
    ).not.toBeInTheDocument()
  })
})
