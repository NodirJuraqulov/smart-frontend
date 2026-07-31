import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock, post: postMock },
}))

import {
  acceptExitCandidate,
  dismissExitCandidate,
  getExitCandidate,
  getExitCandidates,
  reassignExitCandidate,
} from './exitCandidates'

describe('exit candidates API', () => {
  beforeEach(() => {
    getMock.mockReset().mockResolvedValue({ data: {} })
    postMock.mockReset().mockResolvedValue({ data: { candidate: { id: 7 } } })
  })

  it('pending ro‘yxat va detail endpointlarini chaqiradi', async () => {
    await getExitCandidates()
    await getExitCandidate(7)

    expect(getMock).toHaveBeenNthCalledWith(1, '/api/exit-candidates', {
      params: { page: 1, limit: 100 },
    })
    expect(getMock).toHaveBeenNthCalledWith(2, '/api/exit-candidates/7')
  })

  it('accept endpointini chaqiradi', async () => {
    await acceptExitCandidate(7)
    expect(postMock).toHaveBeenCalledWith('/api/exit-candidates/7/accept')
  })

  it('reassign uchun session_id yuboradi', async () => {
    await reassignExitCandidate(7, 44)
    expect(postMock).toHaveBeenCalledWith('/api/exit-candidates/7/reassign', {
      session_id: 44,
    })
  })

  it('dismiss note qiymatini yuboradi', async () => {
    await dismissExitCandidate(7, '  OCR xato  ')
    expect(postMock).toHaveBeenCalledWith('/api/exit-candidates/7/dismiss', {
      note: 'OCR xato',
    })
  })
})
