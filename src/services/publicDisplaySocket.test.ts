import { describe, expect, it, vi } from 'vitest'

const { ioMock, socket } = vi.hoisted(() => ({
  ioMock: vi.fn(),
  socket: { connected: false },
}))

vi.mock('socket.io-client', () => ({
  io: ioMock.mockReturnValue(socket),
}))

import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import { connectPublicDisplaySocket } from './publicDisplaySocket'

describe('public display socket', () => {
  it('resolved runtime host, orgId va mavjud reconnect sozlamalarini ishlatadi', () => {
    expect(connectPublicDisplaySocket(7)).toBe(socket)
    expect(ioMock).toHaveBeenCalledWith(API_BASE_URL, {
      auth: { orgId: 7 },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })
  })
})
