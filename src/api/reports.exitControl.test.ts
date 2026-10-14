import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock },
}))

import { getExitControlReport } from './reports'

describe('exit control report API', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('from va to bilan exit-control endpointini chaqiradi', async () => {
    const response = { days: [], totals: {} }
    getMock.mockResolvedValue({ data: response })

    await expect(
      getExitControlReport({ from: '2026-10-13', to: '2026-10-14' }),
    ).resolves.toBe(response)
    expect(getMock).toHaveBeenCalledWith('/api/reports/exit-control', {
      params: { from: '2026-10-13', to: '2026-10-14' },
    })
  })
})
