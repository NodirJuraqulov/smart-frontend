import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import PricingModeCard from './PricingModeCard'
import type { TariffInterval } from '@/types/tariffInterval'
import type { Tariff } from '@/types/tariff'

const {
  getTariffIntervalsAdminMock,
  createTariffIntervalAdminMock,
  updateTariffIntervalAdminMock,
  deleteTariffIntervalAdminMock,
  updatePricingModeMock,
  updateTariffMock,
} = vi.hoisted(() => ({
  getTariffIntervalsAdminMock: vi.fn(),
  createTariffIntervalAdminMock: vi.fn(),
  updateTariffIntervalAdminMock: vi.fn(),
  deleteTariffIntervalAdminMock: vi.fn(),
  updatePricingModeMock: vi.fn(),
  updateTariffMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getTariffIntervalsAdmin: getTariffIntervalsAdminMock,
  createTariffIntervalAdmin: createTariffIntervalAdminMock,
  updateTariffIntervalAdmin: updateTariffIntervalAdminMock,
  deleteTariffIntervalAdmin: deleteTariffIntervalAdminMock,
  updatePricingMode: updatePricingModeMock,
}))

vi.mock('@/api/tariffs', () => ({
  updateTariff: updateTariffMock,
}))

const interval: TariffInterval = {
  id: 1,
  org_id: 1,
  from_minutes: 0,
  to_minutes: 60,
  price: 5000,
  created_at: '2026-07-01T00:00:00.000Z',
}

const tariff: Tariff = {
  id: 1,
  org_id: 1,
  price_per_hour: 5000,
  grace_period_minutes: 15,
  created_at: '2026-07-01T00:00:00.000Z',
}

function renderCard(
  pricingMode: 'hourly' | 'interval',
  tariffValue: Tariff | null = tariff,
  tariffLoading = false,
) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <PricingModeCard
          orgId={1}
          pricingMode={pricingMode}
          tariff={tariffValue}
          tariffLoading={tariffLoading}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('PricingModeCard', () => {
  beforeEach(() => {
    getTariffIntervalsAdminMock.mockReset().mockResolvedValue([])
    createTariffIntervalAdminMock.mockReset()
    updateTariffIntervalAdminMock.mockReset()
    deleteTariffIntervalAdminMock.mockReset()
    updatePricingModeMock.mockReset()
    updateTariffMock.mockReset()
  })

  it("hourly rejimda interval jadvali korsatilmaydi", () => {
    renderCard('hourly')
    expect(screen.queryByText('Yangi interval')).not.toBeInTheDocument()
  })

  it("Interval radio tanlanganda updatePricingMode chaqiriladi (regression)", async () => {
    updatePricingModeMock.mockResolvedValue({})
    renderCard('hourly')

    fireEvent.click(screen.getByRole('radio', { name: 'Interval' }))

    await waitFor(() => expect(updatePricingModeMock).toHaveBeenCalled())
    expect(updatePricingModeMock.mock.calls[0][0]).toEqual({
      id: 1,
      pricing_mode: 'interval',
    })
  })

  it("interval rejimda mavjud intervallarni jadvalda korsatadi", async () => {
    getTariffIntervalsAdminMock.mockResolvedValue([interval])
    renderCard('interval')

    await waitFor(() =>
      expect(screen.getByText("5 000 so'm")).toBeInTheDocument(),
    )
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it("'to_minutes' bosh bolsa 'Cheksiz' korsatadi", async () => {
    getTariffIntervalsAdminMock.mockResolvedValue([
      { ...interval, to_minutes: null },
    ])
    renderCard('interval')

    await waitFor(() => expect(screen.getByText('Cheksiz')).toBeInTheDocument())
  })

  it("interval royxati NESTED admin yoli orqali org id bilan olinadi (regression)", async () => {
    getTariffIntervalsAdminMock.mockResolvedValue([interval])
    renderCard('interval')

    await waitFor(() =>
      expect(getTariffIntervalsAdminMock).toHaveBeenCalledWith(1),
    )
  })

  it("Yangi interval yaratish NESTED admin yoli orqali org id bilan yuboradi (regression)", async () => {
    createTariffIntervalAdminMock.mockResolvedValue(interval)
    renderCard('interval')

    fireEvent.click(
      await screen.findByRole('button', { name: /Yangi interval/ }),
    )

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '0' } })
    fireEvent.change(inputs[1], { target: { value: '60' } })
    fireEvent.change(inputs[2], { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() =>
      expect(createTariffIntervalAdminMock).toHaveBeenCalled(),
    )
    expect(createTariffIntervalAdminMock).toHaveBeenCalledWith({
      orgId: 1,
      from_minutes: 0,
      to_minutes: 60,
      price: 5000,
    })
  })

  it("interval ochirish NESTED admin yoli orqali org id bilan yuboradi (regression)", async () => {
    getTariffIntervalsAdminMock.mockResolvedValue([interval])
    deleteTariffIntervalAdminMock.mockResolvedValue(undefined)
    renderCard('interval')

    await waitFor(() =>
      expect(screen.getByText("5 000 so'm")).toBeInTheDocument(),
    )
    fireEvent.click(screen.getByRole('button', { name: /O'chirish/ }))
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))

    await waitFor(() =>
      expect(deleteTariffIntervalAdminMock).toHaveBeenCalledWith({
        orgId: 1,
        id: 1,
      }),
    )
  })

  it("hourly rejimda Narx va Bepul kirish vaqti korsatiladi", () => {
    renderCard('hourly')

    expect(screen.getByText("5 000 so'm")).toBeInTheDocument()
    expect(screen.getByText('15 daqiqa')).toBeInTheDocument()
  })

  it("Narxni tahrirlash FAQAT narx maydonini ochadi va faqat narxni yuboradi (regression)", async () => {
    updateTariffMock.mockResolvedValue({ ...tariff, price_per_hour: 6000 })
    renderCard('hourly')

    const editButtons = screen.getAllByRole('button', { name: /Tahrirlash/ })
    fireEvent.click(editButtons[0])

    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.getByText('15 daqiqa')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '6000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateTariffMock).toHaveBeenCalled())
    expect(updateTariffMock).toHaveBeenCalledWith({
      id: 1,
      price_per_hour: 6000,
      grace_period_minutes: 15,
    })
  })

  it("Bepul kirish vaqtini tahrirlash FAQAT o'sha maydonni ochadi va faqat uni yuboradi (regression)", async () => {
    updateTariffMock.mockResolvedValue({
      ...tariff,
      grace_period_minutes: 20,
    })
    renderCard('hourly')

    const editButtons = screen.getAllByRole('button', { name: /Tahrirlash/ })
    fireEvent.click(editButtons[1])

    expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    expect(screen.getByText("5 000 so'm")).toBeInTheDocument()

    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateTariffMock).toHaveBeenCalled())
    expect(updateTariffMock).toHaveBeenCalledWith({
      id: 1,
      price_per_hour: 5000,
      grace_period_minutes: 20,
    })
  })

  it("interval rejimga otishda hourly tarif maydonlari korinmaydi", async () => {
    getTariffIntervalsAdminMock.mockResolvedValue([interval])
    renderCard('interval')

    await waitFor(() =>
      expect(screen.getByText("5 000 so'm")).toBeInTheDocument(),
    )
    expect(screen.queryByText('15 daqiqa')).not.toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument()
  })
})
