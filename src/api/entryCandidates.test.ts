import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock, post: postMock },
}))

import {
  acceptEntryCandidate,
  createManualParkingEntry,
  declineEntryCandidate,
  getNextEntryCandidate,
  retryEntryBarrier,
} from './entryCandidates'

describe('entry candidates API', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset().mockResolvedValue({ data: {} })
  })

  it('next 204 javobini nullga aylantiradi', async () => {
    getMock.mockResolvedValue({ status: 204 })

    await expect(getNextEntryCandidate()).resolves.toBeNull()
    expect(getMock).toHaveBeenCalledWith('/api/entry-candidates/next')
  })

  it('next 200 candidate javobini qaytaradi', async () => {
    const candidate = { candidate_id: 1 }
    getMock.mockResolvedValue({ status: 200, data: candidate })

    await expect(getNextEntryCandidate()).resolves.toBe(candidate)
  })

  it('accept va decline endpointlarini chaqiradi', async () => {
    await acceptEntryCandidate(1, { plate_number: '01A777BA' })
    await declineEntryCandidate(1)

    expect(postMock).toHaveBeenNthCalledWith(
      1,
      '/api/entry-candidates/1/accept',
      { plate_number: '01A777BA' },
    )
    expect(postMock).toHaveBeenNthCalledWith(
      2,
      '/api/entry-candidates/1/decline',
      {},
    )
  })

  it('manual-entry va retry-entry-barrier endpointlarini chaqiradi', async () => {
    await createManualParkingEntry({
      plate_number: '01A777BA',
      reason: 'camera_unavailable',
    })
    await retryEntryBarrier(7)

    expect(postMock).toHaveBeenNthCalledWith(
      1,
      '/api/parking-sessions/manual-entry',
      { plate_number: '01A777BA', reason: 'camera_unavailable' },
    )
    expect(postMock).toHaveBeenNthCalledWith(
      2,
      '/api/parking-sessions/7/retry-entry-barrier',
    )
  })
})
