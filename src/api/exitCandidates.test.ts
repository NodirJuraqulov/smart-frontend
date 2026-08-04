import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: { get: getMock, post: postMock },
}))

import {
  confirmExitCandidate,
  forceOpenExitCandidate,
  getNextExitCandidate,
  retryExitCandidateBarrier,
  searchExitCandidate,
} from './exitCandidates'

describe('exit candidates API', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset().mockResolvedValue({ data: {} })
  })

  it('next 204 javobini null qiymatiga aylantiradi', async () => {
    getMock.mockResolvedValue({ status: 204 })

    await expect(getNextExitCandidate()).resolves.toBeNull()
    expect(getMock).toHaveBeenCalledWith('/api/exit-candidates/next')
  })

  it('next 200 candidate javobini qaytaradi', async () => {
    const candidate = { candidate_id: 'candidate-1', status: 'pending' }
    getMock.mockResolvedValue({ status: 200, data: candidate })

    await expect(getNextExitCandidate()).resolves.toBe(candidate)
  })

  it('search uchun trim qilingan plate yuboradi', async () => {
    await searchExitCandidate('candidate/1', '  01A777BA  ')

    expect(postMock).toHaveBeenCalledWith(
      '/api/exit-candidates/candidate%2F1/search',
      { plate: '01A777BA' },
    )
  })

  it('barcha active sessiyalar uchun searchni bodysiz yuboradi', async () => {
    await searchExitCandidate('candidate-1')

    expect(postMock).toHaveBeenCalledWith(
      '/api/exit-candidates/candidate-1/search',
    )
  })

  it('confirm payloadini o‘zgartirmasdan yuboradi', async () => {
    await confirmExitCandidate('candidate-1', {
      session_id: 'session-2',
      payment_method: 'cash',
    })

    expect(postMock).toHaveBeenCalledWith(
      '/api/exit-candidates/candidate-1/confirm',
      { session_id: 'session-2', payment_method: 'cash' },
    )
  })

  it('force-open va retry-barrier endpointlarini chaqiradi', async () => {
    await forceOpenExitCandidate('candidate-1')
    await retryExitCandidateBarrier('candidate-1')

    expect(postMock).toHaveBeenNthCalledWith(
      1,
      '/api/exit-candidates/candidate-1/force-open',
    )
    expect(postMock).toHaveBeenNthCalledWith(
      2,
      '/api/exit-candidates/candidate-1/retry-barrier',
    )
  })
})
