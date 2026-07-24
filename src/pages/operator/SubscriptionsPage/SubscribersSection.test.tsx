import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import SubscribersSection from './SubscribersSection'
import type { SubscriptionPlan } from '@/types/subscriptionPlan'
import type { Subscription } from '@/types/subscription'

const {
  getSubscriptionsMock,
  createSubscriptionMock,
  renewSubscriptionMock,
  deleteSubscriptionMock,
} = vi.hoisted(() => ({
  getSubscriptionsMock: vi.fn(),
  createSubscriptionMock: vi.fn(),
  renewSubscriptionMock: vi.fn(),
  deleteSubscriptionMock: vi.fn(),
}))

vi.mock('@/api/subscriptions', () => ({
  getSubscriptions: getSubscriptionsMock,
  createSubscription: createSubscriptionMock,
  renewSubscription: renewSubscriptionMock,
  deleteSubscription: deleteSubscriptionMock,
}))

const plans: SubscriptionPlan[] = [
  {
    id: 1,
    org_id: 1,
    name: 'Oylik',
    duration_days: 30,
    price: 150000,
    is_blocked: false,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
  },
]

const subscription: Subscription = {
  id: 1,
  org_id: 1,
  plan_id: 1,
  plate_number: '01A777BA',
  plan_name_snapshot: 'Oylik',
  price_snapshot: 150000,
  duration_days_snapshot: 30,
  start_date: '2026-07-01T00:00:00.000Z',
  end_date: '2026-07-31T00:00:00.000Z',
  last_renewed_at: null,
  status: 'active',
  created_at: '2026-07-01T00:00:00.000Z',
}

function renderSection() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdApp>
          <SubscribersSection plans={plans} />
        </AntdApp>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('SubscribersSection', () => {
  beforeEach(() => {
    getSubscriptionsMock.mockReset()
    createSubscriptionMock.mockReset()
    renewSubscriptionMock.mockReset()
    deleteSubscriptionMock.mockReset()
  })

  it("'Yangi mashina qo'shish' orqali obunachi qo'shadi (regression)", async () => {
    getSubscriptionsMock.mockResolvedValue([])
    createSubscriptionMock.mockResolvedValue(subscription)
    renderSection()

    fireEvent.click(
      await screen.findByRole('button', { name: /Yangi mashina qo'shish/ }),
    )
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01A777BA'), {
      target: { value: '01A777BA' },
    })

    const planSelect = screen.getByText('Rejani tanlang')
    fireEvent.mouseDown(planSelect)
    fireEvent.click(await screen.findByTitle('Oylik'))

    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(createSubscriptionMock).toHaveBeenCalled())
    expect(createSubscriptionMock.mock.calls[0][0]).toEqual({
      plate_number: '01A777BA',
      plan_id: 1,
    })
  })

  it("status filtrini o'zgartirganda getSubscriptions to'g'ri parametr bilan chaqiriladi (regression)", async () => {
    getSubscriptionsMock.mockResolvedValue([])
    renderSection()

    await waitFor(() =>
      expect(getSubscriptionsMock).toHaveBeenCalledWith({
        plate_number: undefined,
        plan_id: undefined,
        status: undefined,
      }),
    )

    const statusSelect = screen.getAllByRole('combobox')[1]
    fireEvent.mouseDown(statusSelect)
    fireEvent.click(await screen.findByTitle('Tugagan'))

    await waitFor(() =>
      expect(getSubscriptionsMock).toHaveBeenLastCalledWith({
        plate_number: undefined,
        plan_id: undefined,
        status: 'expired',
      }),
    )
  })

  it('qidiruv matni orqali plate_number filtri yuboriladi', async () => {
    getSubscriptionsMock.mockResolvedValue([])
    renderSection()

    await waitFor(() => expect(getSubscriptionsMock).toHaveBeenCalled())

    fireEvent.change(screen.getByPlaceholderText('Nomer bo\'yicha qidirish'), {
      target: { value: '01A' },
    })

    await waitFor(() =>
      expect(getSubscriptionsMock).toHaveBeenLastCalledWith({
        plate_number: '01A',
        plan_id: undefined,
        status: undefined,
      }),
    )
  })

  it('3 kundan kam qolgan faol obunani ogohlantiruvchi qator sifatida belgilaydi', async () => {
    const expiringSoon: Subscription = {
      ...subscription,
      id: 2,
      end_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    }
    getSubscriptionsMock.mockResolvedValue([expiringSoon])
    renderSection()

    const row = await screen.findByText('01A777BA')
    const tr = row.closest('tr')
    expect(tr).toHaveClass('subscription-row-expiring')
  })
})
