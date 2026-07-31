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
  entryManual,
  exitManual,
  forceCloseSession,
  getCapacity,
  updateSessionPaymentMethod,
} from '@/api/parking'

describe('getCapacity', () => {
  it("to'g'ri endpoint chaqiradi va javobni qaytaradi", async () => {
    getMock.mockResolvedValue({
      data: { occupied: 5, total: 20, available: 15 },
    })

    const capacity = await getCapacity()

    expect(getMock).toHaveBeenCalledWith('/api/parking/capacity')
    expect(capacity).toEqual({ occupied: 5, total: 20, available: 15 })
  })
})

describe('entryManual', () => {
  it("plate_number ni oddiy JSON payload sifatida yuboradi (regression)", async () => {
    postMock.mockResolvedValue({ data: { session: { id: 1 } } })

    await entryManual('01A777BA')

    expect(postMock).toHaveBeenCalledWith('/api/parking/entry/manual', {
      plate_number: '01A777BA',
    })
  })
})

describe('exitManual', () => {
  it('payment_method ni payload ichida yuboradi (regression)', async () => {
    postMock.mockResolvedValue({
      data: { session: { id: 1 }, payment: { id: 1 } },
    })

    await exitManual('01A777BA', 'online')

    expect(postMock).toHaveBeenCalledWith('/api/parking/exit/manual', {
      plate_number: '01A777BA',
      payment_method: 'online',
    })
  })
})

describe('forceCloseSession', () => {
  it('payment_method majburiy maydon sifatida yuboriladi (regression)', async () => {
    postMock.mockResolvedValue({
      data: { session: { id: 1 }, payment: { id: 1 } },
    })

    await forceCloseSession(7, {
      exited_at: '2026-07-01T10:00:00.000Z',
      payment_method: 'cash',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/api/parking/sessions/7/force-close',
      { exited_at: '2026-07-01T10:00:00.000Z', payment_method: 'cash' },
    )
  })
})

describe('updateSessionPaymentMethod', () => {
  it("yangi /payment-method endpoint'ga POST yuboradi (regression)", async () => {
    postMock.mockResolvedValue({
      data: { session: { id: 3 }, payment: { id: 3, payment_method: 'online' } },
    })

    const result = await updateSessionPaymentMethod({
      id: 3,
      payment_method: 'online',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/api/parking/sessions/3/payment-method',
      { payment_method: 'online' },
    )
    expect(result.payment.payment_method).toBe('online')
  })
})
