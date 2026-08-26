import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock },
}))

import { getEmergencyExitHistory } from './emergencyExitHistory'

describe('emergency exit history API', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({
      data: {
        history: [],
        pagination: { page: 2, limit: 20, total: 0, total_pages: 1 },
      },
    })
  })

  it('organization, page va limit bilan to‘g‘ri GET yuboradi', async () => {
    const result = await getEmergencyExitHistory(7, { page: 2, limit: 20 })

    expect(getMock).toHaveBeenCalledWith(
      '/api/organizations/7/emergency-exit-history',
      { params: { page: 2, limit: 20 } },
    )
    expect(result.pagination.page).toBe(2)
  })
})
