import { describe, expect, it, vi } from 'vitest'

const { getMock, postMock, putMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  putMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: {
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  },
}))

import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from '@/api/subscriptionPlans'

describe('getSubscriptionPlans', () => {
  it('price string kelsa number ga aylantiradi (regression)', async () => {
    getMock.mockResolvedValue({
      data: {
        plans: [
          {
            id: 1,
            org_id: 1,
            name: 'Oylik',
            duration_days: 30,
            price: '150000.00',
            is_blocked: false,
            created_at: '2026-07-01T00:00:00.000Z',
            updated_at: '2026-07-01T00:00:00.000Z',
          },
        ],
      },
    })

    const plans = await getSubscriptionPlans()

    expect(plans[0].price).toBe(150000)
    expect(typeof plans[0].price).toBe('number')
  })
})

describe('createSubscriptionPlan', () => {
  it("yangi rejani to'g'ri payload bilan yuboradi va javobni map qiladi", async () => {
    postMock.mockResolvedValue({
      data: {
        plan: {
          id: 2,
          org_id: 1,
          name: 'Yillik',
          duration_days: 365,
          price: '1000000.00',
          is_blocked: false,
          created_at: '2026-07-01T00:00:00.000Z',
          updated_at: '2026-07-01T00:00:00.000Z',
        },
      },
    })

    const plan = await createSubscriptionPlan({
      name: 'Yillik',
      duration_days: 365,
      price: 1000000,
    })

    expect(postMock).toHaveBeenCalledWith('/api/subscription-plans', {
      name: 'Yillik',
      duration_days: 365,
      price: 1000000,
    })
    expect(plan.price).toBe(1000000)
  })
})

describe('updateSubscriptionPlan', () => {
  it("is_blocked holatini to'g'ri id bilan yuboradi", async () => {
    putMock.mockResolvedValue({
      data: {
        plan: {
          id: 3,
          org_id: 1,
          name: 'Haftalik',
          duration_days: 7,
          price: '30000.00',
          is_blocked: true,
          created_at: '2026-07-01T00:00:00.000Z',
          updated_at: '2026-07-01T00:00:00.000Z',
        },
      },
    })

    const plan = await updateSubscriptionPlan({ id: 3, is_blocked: true })

    expect(putMock).toHaveBeenCalledWith('/api/subscription-plans/3', {
      is_blocked: true,
    })
    expect(plan.is_blocked).toBe(true)
  })
})

describe('deleteSubscriptionPlan', () => {
  it("to'g'ri id bilan DELETE yuboradi", async () => {
    deleteMock.mockResolvedValue({})
    await deleteSubscriptionPlan(5)
    expect(deleteMock).toHaveBeenCalledWith('/api/subscription-plans/5')
  })
})
