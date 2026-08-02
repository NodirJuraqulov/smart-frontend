import { describe, expect, it, vi } from 'vitest'

const { createMock, getMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  getMock: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: createMock.mockImplementation(() => ({ get: getMock })),
  },
}))

import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import {
  getDisplayStatus,
  getEntryDisplayStatus,
  getExitDisplayStatus,
} from './publicDisplay'

describe('public display API runtime base', () => {
  it('creates its client with the centralized resolved base URL', async () => {
    getMock.mockResolvedValue({ data: { connected: true } })

    await getDisplayStatus(7)

    expect(createMock).toHaveBeenCalledWith({ baseURL: API_BASE_URL })
    expect(getMock).toHaveBeenCalledWith('/api/public/display/7/status')
  })

  it('entry va exit flow status endpointlarini chaqiradi', async () => {
    getMock.mockResolvedValue({ data: { state: 'idle' } })

    await getEntryDisplayStatus(7)
    await getExitDisplayStatus(7)

    expect(getMock).toHaveBeenCalledWith('/api/public/display/7/entry-status')
    expect(getMock).toHaveBeenCalledWith('/api/public/display/7/exit-status')
  })
})
