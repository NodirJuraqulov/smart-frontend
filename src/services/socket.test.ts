import { beforeEach, describe, expect, it, vi } from 'vitest'

const { ioMock, socketMock } = vi.hoisted(() => {
  const socketMock = {
    on: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    id: 'socket-id',
  }
  return { ioMock: vi.fn(() => socketMock), socketMock }
})

vi.mock('socket.io-client', () => ({ io: ioMock }))

import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import { connectSocket, disconnectSocket } from './socket'
import { connectPublicDisplaySocket } from './publicDisplaySocket'

describe('Socket.IO runtime base', () => {
  beforeEach(() => {
    disconnectSocket()
    ioMock.mockClear()
    socketMock.on.mockClear()
    localStorage.setItem('accessToken', 'access-token')
  })

  it('uses the resolved base for the authenticated operator socket', () => {
    connectSocket()

    expect(ioMock).toHaveBeenCalledWith(API_BASE_URL, {
      auth: expect.any(Function),
    })
    const options = ioMock.mock.calls[0][1]
    const callback = vi.fn()
    options.auth(callback)
    expect(callback).toHaveBeenCalledWith({ token: 'access-token' })
  })

  it('uses the resolved base without changing public display options', () => {
    connectPublicDisplaySocket(9)

    expect(ioMock).toHaveBeenCalledWith(API_BASE_URL, {
      auth: { orgId: 9 },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    })
  })
})
