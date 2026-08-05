import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/contexts/ThemeContext'
import DiscountHistoryTab from './DiscountHistoryTab'
import type { ClinicDiscount } from '@/types/clinicDiscount'

const { getClinicDiscountsMock, useAppSelectorMock } = vi.hoisted(() => ({
  getClinicDiscountsMock: vi.fn(),
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/api/clinicDiscounts', () => ({
  getClinicDiscounts: getClinicDiscountsMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

function baseDiscount(overrides: Partial<ClinicDiscount>): ClinicDiscount {
  return {
    id: 1,
    org_id: 1,
    plate_number: '01A111AA',
    discount_percent: 15,
    status: 'pending',
    source_reference: null,
    created_at: '2026-08-01T08:00:00.000Z',
    used_at: null,
    used_session_id: null,
    cancelled_by: null,
    cancelled_at: null,
    ...overrides,
  }
}

function renderTab() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DiscountHistoryTab />
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('DiscountHistoryTab', () => {
  beforeEach(() => {
    getClinicDiscountsMock.mockReset()
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ auth: { user: { role: 'owner', org_id: 1 } } }),
    )
  })

  it("barcha statuslarni togri badge bilan korsatadi", async () => {
    getClinicDiscountsMock.mockResolvedValue({
      discounts: [
        baseDiscount({ id: 1, plate_number: '01A111AA', status: 'pending' }),
        baseDiscount({
          id: 2,
          plate_number: '01A222AA',
          status: 'used',
          used_at: '2026-08-02T09:00:00.000Z',
          used_session_id: 77,
        }),
        baseDiscount({ id: 3, plate_number: '01A333AA', status: 'expired' }),
        baseDiscount({ id: 4, plate_number: '01A444AA', status: 'cancelled' }),
      ],
      pagination: { page: 1, limit: 10, total: 4, total_pages: 1 },
    })

    renderTab()

    expect(await screen.findByText('Kutilmoqda')).toBeInTheDocument()
    expect(screen.getByText('Ishlatilgan')).toBeInTheDocument()
    expect(screen.getByText('Eskirgan')).toBeInTheDocument()
    expect(screen.getByText('Bekor qilingan')).toBeInTheDocument()
    expect(screen.getByText('77')).toBeInTheDocument()
    expect(getClinicDiscountsMock).toHaveBeenCalledWith(1, {
      status: 'all',
      page: 1,
      limit: 10,
    })
  })
})
