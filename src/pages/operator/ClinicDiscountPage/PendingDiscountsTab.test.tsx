import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import PendingDiscountsTab from './PendingDiscountsTab'
import type { ClinicDiscount } from '@/types/clinicDiscount'

const { getClinicDiscountsMock, cancelClinicDiscountMock, useAppSelectorMock } =
  vi.hoisted(() => ({
    getClinicDiscountsMock: vi.fn(),
    cancelClinicDiscountMock: vi.fn(),
    useAppSelectorMock: vi.fn(),
  }))

vi.mock('@/api/clinicDiscounts', () => ({
  getClinicDiscounts: getClinicDiscountsMock,
  cancelClinicDiscount: cancelClinicDiscountMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

const pendingDiscount: ClinicDiscount = {
  id: 5,
  org_id: 1,
  plate_number: '01A777BA',
  discount_percent: 20,
  status: 'pending',
  source_reference: 'medplus-ref-1',
  created_at: '2026-08-01T08:00:00.000Z',
  used_at: null,
  used_session_id: null,
  cancelled_by: null,
  cancelled_at: null,
}

function mockAuthUser(role: 'operator' | 'owner' | 'super_admin') {
  useAppSelectorMock.mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({ auth: { user: { role, org_id: 1 } } }),
  )
}

function renderTab() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <PendingDiscountsTab />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('PendingDiscountsTab', () => {
  beforeEach(() => {
    getClinicDiscountsMock.mockReset()
    cancelClinicDiscountMock.mockReset()
    useAppSelectorMock.mockReset()
  })

  it("kutilayotgan chegirmalarni togri korsatadi", async () => {
    mockAuthUser('owner')
    getClinicDiscountsMock.mockResolvedValue({
      discounts: [pendingDiscount],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    })

    renderTab()

    expect(await screen.findByText('01A777BA')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
    expect(screen.getByText('medplus-ref-1')).toBeInTheDocument()
    expect(getClinicDiscountsMock).toHaveBeenCalledWith(1, { status: 'pending' })
  })

  it("Bekor qilish tugmasi togri chaqiriladi va royxat yangilanadi", async () => {
    mockAuthUser('owner')
    getClinicDiscountsMock.mockResolvedValue({
      discounts: [pendingDiscount],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    })
    cancelClinicDiscountMock.mockResolvedValue({
      ...pendingDiscount,
      status: 'cancelled',
    })

    renderTab()

    await screen.findByText('01A777BA')
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))
    fireEvent.click(await screen.findByText('OK'))

    await waitFor(() =>
      expect(cancelClinicDiscountMock).toHaveBeenCalledWith({
        orgId: 1,
        discountId: 5,
      }),
    )
    await waitFor(() => expect(getClinicDiscountsMock).toHaveBeenCalledTimes(2))
  })

  it("Operator uchun Bekor qilish tugmasi korinmaydi", async () => {
    mockAuthUser('operator')
    getClinicDiscountsMock.mockResolvedValue({
      discounts: [pendingDiscount],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    })

    renderTab()

    await screen.findByText('01A777BA')
    expect(
      screen.queryByRole('button', { name: 'Bekor qilish' }),
    ).not.toBeInTheDocument()
  })
})
