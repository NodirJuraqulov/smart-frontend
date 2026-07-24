import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PlansSection from './PlansSection'
import type { SubscriptionPlan } from '@/types/subscriptionPlan'

const {
  getSubscriptionPlansMock,
  createSubscriptionPlanMock,
  updateSubscriptionPlanMock,
  deleteSubscriptionPlanMock,
} = vi.hoisted(() => ({
  getSubscriptionPlansMock: vi.fn(),
  createSubscriptionPlanMock: vi.fn(),
  updateSubscriptionPlanMock: vi.fn(),
  deleteSubscriptionPlanMock: vi.fn(),
}))

vi.mock('@/api/subscriptionPlans', () => ({
  getSubscriptionPlans: getSubscriptionPlansMock,
  createSubscriptionPlan: createSubscriptionPlanMock,
  updateSubscriptionPlan: updateSubscriptionPlanMock,
  deleteSubscriptionPlan: deleteSubscriptionPlanMock,
}))

const plan: SubscriptionPlan = {
  id: 1,
  org_id: 1,
  name: 'Oylik',
  duration_days: 30,
  price: 150000,
  is_blocked: false,
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-01T00:00:00.000Z',
}

function renderSection() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdApp>
          <PlansSection />
        </AntdApp>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('PlansSection', () => {
  beforeEach(() => {
    getSubscriptionPlansMock.mockReset()
    createSubscriptionPlanMock.mockReset()
    updateSubscriptionPlanMock.mockReset()
    deleteSubscriptionPlanMock.mockReset()
  })

  it("'Yangi reja' orqali reja yaratadi (regression)", async () => {
    getSubscriptionPlansMock.mockResolvedValue([])
    createSubscriptionPlanMock.mockResolvedValue(plan)
    renderSection()

    fireEvent.click(await screen.findByRole('button', { name: /Yangi reja/ }))

    fireEvent.change(screen.getByPlaceholderText('Masalan: Oylik'), {
      target: { value: 'Oylik' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masalan: 30'), {
      target: { value: '30' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masalan: 150000'), {
      target: { value: '150000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(createSubscriptionPlanMock).toHaveBeenCalled())
    expect(createSubscriptionPlanMock.mock.calls[0][0]).toEqual({
      name: 'Oylik',
      duration_days: 30,
      price: 150000,
    })
  })

  it("'Bloklash' bosilganda is_blocked:true bilan yangilaydi", async () => {
    getSubscriptionPlansMock.mockResolvedValue([plan])
    updateSubscriptionPlanMock.mockResolvedValue({ ...plan, is_blocked: true })
    renderSection()

    fireEvent.click(await screen.findByRole('button', { name: /Bloklash/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'OK' }))

    await waitFor(() => expect(updateSubscriptionPlanMock).toHaveBeenCalled())
    expect(updateSubscriptionPlanMock.mock.calls[0][0]).toEqual({
      id: 1,
      is_blocked: true,
    })
  })
})
