import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock },
}))

import { getForcedOpenHistory } from './forcedOpenHistory'

describe('forced open history API', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({
      data: {
        history: [],
        pagination: { page: 2, limit: 20, total: 0, total_pages: 1 },
      },
    })
  })

  it('organization, page va limit bilan to‘g‘ri GET yuboradi', async () => {
    const result = await getForcedOpenHistory(7, { page: 2, limit: 20 })

    expect(getMock).toHaveBeenCalledWith(
      '/api/organizations/7/forced-open-history',
      { params: { page: 2, limit: 20 } },
    )
    expect(result.pagination.page).toBe(2)
  })
})
