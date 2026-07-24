import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import HourlyTariffCard from './HourlyTariffCard'
import { formatMoney } from '@/utils/format'
import type { Tariff } from '@/types/tariff'

const money = (value: number) => formatMoney(value).replace(/ /g, ' ')

const { getTariffsMock, updateTariffMock } = vi.hoisted(() => ({
  getTariffsMock: vi.fn(),
  updateTariffMock: vi.fn(),
}))

vi.mock('@/api/tariffs', () => ({
  getTariffs: getTariffsMock,
  updateTariff: updateTariffMock,
}))

const tariff: Tariff = {
  id: 1,
  org_id: 1,
  price_per_hour: 10000,
  grace_period_minutes: 10,
  created_at: '2026-07-01T00:00:00.000Z',
}

function renderPage() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <HourlyTariffCard />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('HourlyTariffCard', () => {
  beforeEach(() => {
    getTariffsMock.mockReset()
    updateTariffMock.mockReset()
  })

  it("dastlab ko'rish rejimida ochiladi, Input emas oddiy matn ko'rsatiladi", async () => {
    getTariffsMock.mockResolvedValue([tariff])
    renderPage()

    await waitFor(() =>
      expect(screen.getByText(money(10000))).toBeInTheDocument(),
    )
    expect(screen.getByText('10 daqiqa')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()
  })

  it("'Tahrirlash' bosilganda forma joriy qiymatlar bilan ochiladi (regression)", async () => {
    getTariffsMock.mockResolvedValue([tariff])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))

    expect(screen.getByDisplayValue('10000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saqlash' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bekor qilish' }),
    ).toBeInTheDocument()
  })

  it("'Saqlash' muvaffaqiyatli bo'lsa ko'rish rejimiga qaytadi va yangi qiymatlarni ko'rsatadi (regression)", async () => {
    getTariffsMock
      .mockResolvedValueOnce([tariff])
      .mockResolvedValueOnce([
        { ...tariff, price_per_hour: 7000, grace_period_minutes: 20 },
      ])
    updateTariffMock.mockResolvedValue({
      ...tariff,
      price_per_hour: 7000,
      grace_period_minutes: 20,
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))
    fireEvent.change(screen.getByDisplayValue('10000'), {
      target: { value: '7000' },
    })
    fireEvent.change(screen.getByDisplayValue('10'), {
      target: { value: '20' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateTariffMock).toHaveBeenCalledTimes(1))
    expect(updateTariffMock).toHaveBeenCalledWith({
      id: 1,
      price_per_hour: 7000,
      grace_period_minutes: 20,
    })

    await waitFor(() =>
      expect(screen.getByText(money(7000))).toBeInTheDocument(),
    )
    expect(screen.getByText('20 daqiqa')).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it("FAQAT Bepul kirish vaqtini o'zgartirib, Narxga tegmasdan Saqlash muvaffaqiyatli ishlaydi (regression)", async () => {
    getTariffsMock.mockResolvedValue([tariff])
    updateTariffMock.mockResolvedValue({
      ...tariff,
      grace_period_minutes: 25,
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))
    fireEvent.change(screen.getByDisplayValue('10'), {
      target: { value: '25' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateTariffMock).toHaveBeenCalledTimes(1))
    expect(updateTariffMock).toHaveBeenCalledWith({
      id: 1,
      price_per_hour: 10000,
      grace_period_minutes: 25,
    })
  })

  it("FAQAT Narxni o'zgartirib, Bepul kirish vaqtiga tegmasdan Saqlash muvaffaqiyatli ishlaydi (regression)", async () => {
    getTariffsMock.mockResolvedValue([tariff])
    updateTariffMock.mockResolvedValue({
      ...tariff,
      price_per_hour: 12000,
    })
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))
    fireEvent.change(screen.getByDisplayValue('10000'), {
      target: { value: '12000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateTariffMock).toHaveBeenCalledTimes(1))
    expect(updateTariffMock).toHaveBeenCalledWith({
      id: 1,
      price_per_hour: 12000,
      grace_period_minutes: 10,
    })
  })

  it("'Bekor qilish' bosilganda ko'rish rejimiga qaytadi, updateTariff chaqirilmaydi", async () => {
    getTariffsMock.mockResolvedValue([tariff])
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))
    fireEvent.change(screen.getByDisplayValue('10000'), {
      target: { value: '9999' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    await waitFor(() =>
      expect(screen.getByText(money(10000))).toBeInTheDocument(),
    )
    expect(updateTariffMock).not.toHaveBeenCalled()
  })

  it("massiv bo'sh bo'lsa 'Tarif topilmadi' holatini ko'rsatadi", async () => {
    getTariffsMock.mockResolvedValue([])
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Tarif topilmadi')).toBeInTheDocument(),
    )
  })
})
