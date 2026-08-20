import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, postMock, deleteMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock, post: postMock, delete: deleteMock },
}))

import {
  createBlacklistedVehicle,
  deleteBlacklistedVehicle,
  getBlacklistedVehicles,
  getBlacklistAttempts,
} from './blacklist'

describe('blacklist API', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ data: {} })
    postMock.mockReset().mockResolvedValue({ data: { vehicle: {} } })
    deleteMock.mockReset().mockResolvedValue({})
  })

  it('qora ro‘yxat va urinishlarni organization scope bilan oladi', async () => {
    getMock
      .mockResolvedValueOnce({ data: { vehicles: [] } })
      .mockResolvedValueOnce({
        data: {
          attempts: [],
          pagination: { page: 2, limit: 20, total: 0, total_pages: 1 },
        },
      })

    await getBlacklistedVehicles(7)
    await getBlacklistAttempts(7, { page: 2, limit: 20 })

    expect(getMock).toHaveBeenNthCalledWith(
      1,
      '/api/organizations/7/blacklist',
    )
    expect(getMock).toHaveBeenNthCalledWith(
      2,
      '/api/organizations/7/blacklist-attempts',
      { params: { page: 2, limit: 20 } },
    )
  })

  it('yangi qora ro‘yxat yozuvini to‘g‘ri body bilan yuboradi', async () => {
    await createBlacklistedVehicle({
      orgId: 7,
      plate_number: '01A777BA',
      reason: 'Xavfsizlik',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/api/organizations/7/blacklist',
      { plate_number: '01A777BA', reason: 'Xavfsizlik' },
    )
  })

  it('qora ro‘yxat yozuvini organization va yozuv ID bilan o‘chiradi', async () => {
    await deleteBlacklistedVehicle({ orgId: 7, blacklistId: 19 })

    expect(deleteMock).toHaveBeenCalledWith(
      '/api/organizations/7/blacklist/19',
    )
  })
})
