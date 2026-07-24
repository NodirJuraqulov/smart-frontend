import axios, { type InternalAxiosRequestConfig } from 'axios'
import { store } from '@/store/store'
import { logout, tokensRefreshed } from '@/store/authSlice'
import i18n from '@/i18n'
import { getMessageApi } from '@/utils/notifier'
import type { RefreshResponse } from '@/types/auth'

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout']

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

function forceLogout() {
  getMessageApi()?.warning(i18n.t('auth.sessionExpired'))
  store.dispatch(logout())
}

function performRefresh(refreshToken: string) {
  return axios
    .post<RefreshResponse>(
      `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
      { refreshToken },
    )
    .then((res) => res.data)
}

let isRefreshing = false
let refreshWaiters: Array<(token: string | null) => void> = []

function subscribeTokenRefresh(callback: (token: string | null) => void) {
  refreshWaiters.push(callback)
}

function notifyRefreshWaiters(token: string | null) {
  refreshWaiters.forEach((callback) => callback(token))
  refreshWaiters = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      getMessageApi()?.error(i18n.t('common.networkError'))
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig | undefined
    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) =>
      originalRequest?.url?.includes(endpoint),
    )

    if (error.response.status !== 401 || isAuthEndpoint || !originalRequest) {
      if (error.response.status === 401 && !isAuthEndpoint) {
        forceLogout()
      }
      return Promise.reject(error)
    }

    const refreshToken = store.getState().auth.refreshToken
    if (!refreshToken || originalRequest._retry) {
      forceLogout()
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((newToken) => {
          if (!newToken) {
            reject(error)
            return
          }
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(axiosInstance(originalRequest))
        })
      })
    }

    isRefreshing = true

    return performRefresh(refreshToken)
      .then((data) => {
        store.dispatch(
          tokensRefreshed({
            accessToken: data.token,
            refreshToken: data.refreshToken,
          }),
        )
        notifyRefreshWaiters(data.token)
        originalRequest.headers.Authorization = `Bearer ${data.token}`
        return axiosInstance(originalRequest)
      })
      .catch((refreshError) => {
        notifyRefreshWaiters(null)
        forceLogout()
        return Promise.reject(refreshError)
      })
      .finally(() => {
        isRefreshing = false
      })
  },
)
