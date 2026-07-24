import { describe, expect, it, vi } from 'vitest'

const { getMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: {
    get: getMock,
    put: putMock,
  },
}))

import { getTariffs, updateTariff } from '@/api/tariffs'

describe('getTariffs', () => {
  it('backend price_per_hour ni string qaytarsa ham number ga aylantiradi (regression)', async () => {
    getMock.mockResolvedValue({
      data: {
        tariffs: [
          {
            id: 1,
            org_id: 1,
            price_per_hour: '12000.00',
            grace_period_minutes: 5,
            created_at: '2026-07-01T00:00:00.000Z',
          },
        ],
      },
    })

    const tariffs = await getTariffs()

    expect(tariffs[0].price_per_hour).toBe(12000)
    expect(typeof tariffs[0].price_per_hour).toBe('number')
    expect(tariffs[0].grace_period_minutes).toBe(5)
    expect(typeof tariffs[0].grace_period_minutes).toBe('number')
  })
})

describe('updateTariff', () => {
  it("javobdagi price_per_hour string bo'lsa ham number ga aylantiradi (regression)", async () => {
    putMock.mockResolvedValue({
      data: {
        tariff: {
          id: 1,
          org_id: 1,
          price_per_hour: '15000.00',
          grace_period_minutes: '10',
          created_at: '2026-07-01T00:00:00.000Z',
        },
      },
    })

    const tariff = await updateTariff({
      id: 1,
      price_per_hour: 15000,
      grace_period_minutes: 10,
    })

    expect(tariff.price_per_hour).toBe(15000)
    expect(typeof tariff.price_per_hour).toBe('number')
    expect(tariff.grace_period_minutes).toBe(10)
    expect(typeof tariff.grace_period_minutes).toBe('number')
  })
})
