import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import AwaitingPaymentsSection from './AwaitingPaymentsSection'
import type { AwaitingPaymentSession } from '@/types/parking'

const { getAwaitingPaymentsMock, confirmCashPaymentMock, openBarrierForSessionMock } =
  vi.hoisted(() => ({
    getAwaitingPaymentsMock: vi.fn(),
    confirmCashPaymentMock: vi.fn(),
    openBarrierForSessionMock: vi.fn(),
  }))

vi.mock('@/api/parking', () => ({
  getAwaitingPayments: getAwaitingPaymentsMock,
  confirmCashPayment: confirmCashPaymentMock,
  openBarrierForSession: openBarrierForSessionMock,
}))

const overdueSession: AwaitingPaymentSession = {
  id: 1,
  org_id: 1,
  plate_number: '01A123BC',
  entered_at: '2026-07-18T08:00:00.000Z',
  exited_at: '2026-07-18T09:00:00.000Z',
  duration_minutes: 60,
  amount: 15000,
  status: 'awaiting_payment',
  entry_method: 'auto',
  exit_method: 'auto',
  image_entry: null,
  image_exit: null,
  operator_id: null,
  created_at: '2026-07-18T08:00:00.000Z',
  is_overdue: true,
}

const freshSession: AwaitingPaymentSession = {
  ...overdueSession,
  id: 2,
  plate_number: '01B456DE',
  is_overdue: false,
}

function renderSection() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <AwaitingPaymentsSection />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('AwaitingPaymentsSection', () => {
  beforeEach(() => {
    getAwaitingPaymentsMock.mockReset().mockResolvedValue([])
    confirmCashPaymentMock.mockReset()
    openBarrierForSessionMock.mockReset()
  })

  it("sessiyalarni royxatda korsatadi va kechikkanlarni belgilaydi", async () => {
    getAwaitingPaymentsMock.mockResolvedValue([overdueSession, freshSession])
    renderSection()

    expect(await screen.findByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByText('01B456DE')).toBeInTheDocument()
    expect(screen.getByText('Kechikkan')).toBeInTheDocument()
  })

  it("turgan vaqtni togri formatda korsatadi (regression)", async () => {
    getAwaitingPaymentsMock.mockResolvedValue([overdueSession])
    renderSection()

    expect(await screen.findByText('1 soat 0 daqiqa')).toBeInTheDocument()
  })

  it("royxat bosh bolsa bosh holat korsatiladi", async () => {
    renderSection()

    expect(
      await screen.findByText('Kutilayotgan to\'lov yo\'q'),
    ).toBeInTheDocument()
  })

  it("'Naqd qabul qilindi' tasdiqlangandan keyin togri id bilan yuboriladi va royxat yangilanadi (regression)", async () => {
    getAwaitingPaymentsMock.mockResolvedValue([overdueSession])
    confirmCashPaymentMock.mockResolvedValue({})
    renderSection()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Naqd qabul qilindi' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ha, tasdiqlash' }))

    await waitFor(() =>
      expect(confirmCashPaymentMock).toHaveBeenCalledWith(1),
    )
    await waitFor(() =>
      expect(getAwaitingPaymentsMock.mock.calls.length).toBeGreaterThanOrEqual(2),
    )
  })

  it("xato bolsa xabar korsatadi", async () => {
    getAwaitingPaymentsMock.mockResolvedValue([overdueSession])
    confirmCashPaymentMock.mockRejectedValue(new Error('network error'))
    renderSection()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Naqd qabul qilindi' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ha, tasdiqlash' }))

    expect(
      await screen.findByText("To'lovni tasdiqlab bo'lmadi"),
    ).toBeInTheDocument()
  })

  it("har bir qatorda shlagbaumni qolda ochish amali mavjud", async () => {
    getAwaitingPaymentsMock.mockResolvedValue([overdueSession])
    renderSection()

    expect(
      await screen.findByRole('button', { name: /Shlagbaumni ochish/ }),
    ).toBeInTheDocument()
  })
})
