import { beforeEach, describe, expect, it, vi } from 'vitest'

interface OperatorSocketOptions {
  auth: (callback: (credentials: { token: string | null }) => void) => void
  reconnection: boolean
  reconnectionDelay: number
  reconnectionDelayMax: number
  randomizationFactor: number
}

type SocketOptions = OperatorSocketOptions | Record<string, unknown>

const { ioMock, socketMock, refreshAccessTokenMock } = vi.hoisted(() => {
  const socketMock = {
    on: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    id: 'socket-id',
  }
  return {
    ioMock: vi.fn((_url: string, _options: SocketOptions) => socketMock),
    socketMock,
    refreshAccessTokenMock: vi.fn(),
  }
})

vi.mock('socket.io-client', () => ({ io: ioMock }))
vi.mock('./authSession', () => ({
  refreshAccessToken: refreshAccessTokenMock,
}))

import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import {
  acquireSocket,
  connectSocket,
  disconnectSocket,
  releaseSocket,
} from './socket'
import { connectPublicDisplaySocket } from './publicDisplaySocket'

describe('Socket.IO runtime base', () => {
  beforeEach(() => {
    disconnectSocket()
    ioMock.mockClear()
    socketMock.on.mockClear()
    socketMock.connect.mockClear()
    socketMock.disconnect.mockClear()
    refreshAccessTokenMock.mockReset()
    localStorage.setItem('accessToken', 'access-token')
  })

  it('uses the resolved base for the authenticated operator socket', () => {
    connectSocket()

    expect(ioMock).toHaveBeenCalledWith(API_BASE_URL, {
      auth: expect.any(Function),
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0,
    })
    const options = ioMock.mock.calls[0][1] as OperatorSocketOptions
    const callback = vi.fn()
    options.auth(callback)
    expect(callback).toHaveBeenCalledWith({ token: 'access-token' })
  })

  it('auth xatosidan keyin tokenni yangilab backoff bilan qayta ulanadi', async () => {
    vi.useFakeTimers()
    refreshAccessTokenMock.mockImplementation(async () => {
      localStorage.setItem('accessToken', 'refreshed-access')
      return 'refreshed-access'
    })

    connectSocket()
    const connectErrorHandler = socketMock.on.mock.calls.find(
      ([event]) => event === 'connect_error',
    )?.[1] as (error: Error) => void

    connectErrorHandler(new Error('Token yaroqsiz yoki muddati tugagan'))
    await vi.waitFor(() => {
      expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1)
    })

    expect(socketMock.connect).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(2000)
    expect(socketMock.connect).toHaveBeenCalledTimes(1)

    const options = ioMock.mock.calls[0][1] as OperatorSocketOptions
    const callback = vi.fn()
    options.auth(callback)
    expect(callback).toHaveBeenCalledWith({ token: 'refreshed-access' })
    vi.useRealTimers()
  })

  it('socketni oxirgi consumer release qilganda uzadi', () => {
    const first = acquireSocket()
    const second = acquireSocket()

    expect(first).toBe(second)
    releaseSocket()
    expect(socketMock.disconnect).not.toHaveBeenCalled()

    releaseSocket()
    expect(socketMock.disconnect).toHaveBeenCalledTimes(1)
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
