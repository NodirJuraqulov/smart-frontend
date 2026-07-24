import { describe, expect, it, vi } from 'vitest'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: {
    get: getMock,
    post: postMock,
  },
}))

import {
  createSubscription,
  getSubscriptions,
  renewSubscription,
} from '@/api/subscriptions'

const subscriptionDto = {
  id: 1,
  org_id: 1,
  plan_id: 2,
  plate_number: '01A777BA',
  plan_name_snapshot: 'Oylik',
  price_snapshot: '150000.00',
  duration_days_snapshot: 30,
  start_date: '2026-07-01T00:00:00.000Z',
  end_date: '2026-07-31T00:00:00.000Z',
  last_renewed_at: null,
  status: 'active' as const,
  created_at: '2026-07-01T00:00:00.000Z',
}

describe('getSubscriptions', () => {
  it('price_snapshot string kelsa number ga aylantiradi (regression)', async () => {
    getMock.mockResolvedValue({ data: { subscriptions: [subscriptionDto] } })

    const subscriptions = await getSubscriptions()

    expect(subscriptions[0].price_snapshot).toBe(150000)
    expect(typeof subscriptions[0].price_snapshot).toBe('number')
  })

  it('filtr parametrlarini query sifatida yuboradi', async () => {
    getMock.mockResolvedValue({ data: { subscriptions: [] } })

    await getSubscriptions({
      plan_id: 2,
      status: 'active',
      plate_number: '01A',
    })

    expect(getMock).toHaveBeenCalledWith('/api/subscriptions', {
      params: { plan_id: 2, status: 'active', plate_number: '01A' },
    })
  })
})

describe('createSubscription', () => {
  it("to'g'ri payload bilan yuboradi", async () => {
    postMock.mockResolvedValue({ data: { subscription: subscriptionDto } })

    const subscription = await createSubscription({
      plate_number: '01A777BA',
      plan_id: 2,
    })

    expect(postMock).toHaveBeenCalledWith('/api/subscriptions', {
      plate_number: '01A777BA',
      plan_id: 2,
    })
    expect(subscription.price_snapshot).toBe(150000)
  })
})

describe('renewSubscription', () => {
  it("POST /:id/renew ga ulanadi (PUT emas)", async () => {
    postMock.mockResolvedValue({ data: { subscription: subscriptionDto } })

    await renewSubscription(1)

    expect(postMock).toHaveBeenCalledWith('/api/subscriptions/1/renew')
  })
})
