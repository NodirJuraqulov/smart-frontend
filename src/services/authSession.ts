import axios from 'axios'
import i18n from '@/i18n'
import { logout, tokensRefreshed } from '@/store/authSlice'
import { store } from '@/store/store'
import type { RefreshResponse } from '@/types/auth'
import { getMessageApi } from '@/utils/notifier'
import { joinRuntimeUrl } from '@/utils/runtimeBaseUrl'

export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

let refreshPromise: Promise<string> | null = null
let sessionInvalidated = false

export function markSessionAuthenticated(): void {
  sessionInvalidated = false
}

export function invalidateSession(): void {
  if (sessionInvalidated) return

  sessionInvalidated = true
  getMessageApi()?.warning(i18n.t('auth.sessionExpired'))
  store.dispatch(logout())
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
}

export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  const refreshToken =
    store.getState().auth.refreshToken ?? localStorage.getItem('refreshToken')

  if (!refreshToken) {
    invalidateSession()
    return Promise.reject(new Error('Refresh token is unavailable'))
  }

  refreshPromise = axios
    .post<RefreshResponse>(joinRuntimeUrl('/api/auth/refresh'), {
      refreshToken,
    })
    .then(({ data }) => {
      if (!data.token) {
        throw new Error('Refresh response does not contain an access token')
      }

      store.dispatch(
        tokensRefreshed({
          accessToken: data.token,
          refreshToken: data.refreshToken,
        }),
      )
      markSessionAuthenticated()
      return data.token
    })
    .catch((error: unknown) => {
      invalidateSession()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}
