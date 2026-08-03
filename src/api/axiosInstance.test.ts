import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout, tokensRefreshed } from '@/store/authSlice'

const {
  mockInstance,
  responseErrorHandlerRef,
  axiosPostMock,
  dispatchMock,
  getStateMock,
  warningMock,
  axiosCreateMock,
} = vi.hoisted(() => {
  const responseErrorHandlerRef: {
    current: ((error: unknown) => unknown) | null
  } = { current: null }
  const axiosPostMock = vi.fn()
  const dispatchMock = vi.fn()
  const getStateMock = vi.fn()
  const warningMock = vi.fn()
  const axiosCreateMock = vi.fn()

  const mockInstance = vi.fn((config: unknown) =>
    Promise.resolve({ data: 'retried', config }),
  ) as unknown as {
    (config: unknown): Promise<unknown>
    mockClear: () => void
    interceptors: {
      request: { use: (handler: (config: unknown) => unknown) => void }
      response: {
        use: (
          success: (response: unknown) => unknown,
          error: (error: unknown) => unknown,
        ) => void
      }
    }
  }

  mockInstance.interceptors = {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(
        (
          _success: (response: unknown) => unknown,
          errorHandler: (error: unknown) => unknown,
        ) => {
          responseErrorHandlerRef.current = errorHandler
        },
      ),
    },
  }

  return {
    mockInstance,
    responseErrorHandlerRef,
    axiosPostMock,
    dispatchMock,
    getStateMock,
    warningMock,
    axiosCreateMock,
  }
})

vi.mock('axios', () => ({
  default: {
    create: axiosCreateMock.mockImplementation(() => mockInstance),
    post: axiosPostMock,
  },
}))

vi.mock('@/store/store', () => ({
  store: {
    dispatch: dispatchMock,
    getState: getStateMock,
  },
}))

vi.mock('@/utils/notifier', () => ({
  getMessageApi: () => ({ warning: warningMock, error: vi.fn() }),
}))

import '@/api/axiosInstance'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import {
  AUTH_SESSION_EXPIRED_EVENT,
  markSessionAuthenticated,
} from '@/services/authSession'

function makeError(status: number, url = '/api/sessions') {
  return {
    response: { status, data: {} },
    config: { url, headers: {} as Record<string, string> },
  }
}

describe('axiosInstance response interceptor', () => {
  beforeEach(() => {
    mockInstance.mockClear()
    axiosPostMock.mockReset()
    dispatchMock.mockClear()
    warningMock.mockClear()
    getStateMock.mockReset()
    localStorage.clear()
    markSessionAuthenticated()
  })

  it('authenticated Axios resolved runtime bazadan foydalanadi', () => {
    expect(axiosCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: API_BASE_URL }),
    )
  })

  it('401 kelganda refresh sorovi yuboriladi', async () => {
    getStateMock.mockReturnValue({ auth: { refreshToken: 'old-refresh' } })
    axiosPostMock.mockResolvedValue({
      data: { token: 'new-access', refreshToken: 'new-refresh' },
    })

    const error = makeError(401)
    await responseErrorHandlerRef.current!(error)

    expect(axiosPostMock).toHaveBeenCalledTimes(1)
    expect(axiosPostMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/api/auth/refresh`,
      { refreshToken: 'old-refresh' },
    )
    expect(dispatchMock).toHaveBeenCalledWith(
      tokensRefreshed({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    )
    expect(mockInstance).toHaveBeenCalledTimes(1)
    expect(error.config.headers.Authorization).toBe('Bearer new-access')
  })

  it('parallel sorovlarda faqat bitta refresh sorovi ketadi', async () => {
    getStateMock.mockReturnValue({ auth: { refreshToken: 'old-refresh' } })
    let resolveRefresh!: (value: unknown) => void
    axiosPostMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      }),
    )

    const error1 = makeError(401, '/api/sessions')
    const error2 = makeError(401, '/api/payments')

    const promise1 = responseErrorHandlerRef.current!(error1)
    const promise2 = responseErrorHandlerRef.current!(error2)

    expect(axiosPostMock).toHaveBeenCalledTimes(1)

    resolveRefresh({
      data: { token: 'new-access', refreshToken: 'new-refresh' },
    })
    await Promise.all([promise1, promise2])

    expect(axiosPostMock).toHaveBeenCalledTimes(1)
    expect(mockInstance).toHaveBeenCalledTimes(2)
  })

  it('refresh 401 bolsa sessiya tozalanib login yonaltirish hodisasi yuboriladi', async () => {
    getStateMock.mockReturnValue({ auth: { refreshToken: 'old-refresh' } })
    axiosPostMock.mockRejectedValue({ response: { status: 401 } })
    const sessionExpiredHandler = vi.fn()
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, sessionExpiredHandler)

    const error = makeError(401)
    await expect(responseErrorHandlerRef.current!(error)).rejects.toEqual({
      response: { status: 401 },
    })

    expect(dispatchMock).toHaveBeenCalledWith(logout())
    expect(warningMock).toHaveBeenCalledTimes(1)
    expect(sessionExpiredHandler).toHaveBeenCalledTimes(1)
    window.removeEventListener(
      AUTH_SESSION_EXPIRED_EVENT,
      sessionExpiredHandler,
    )
  })
})
