import axios, {
  type AxiosRequestHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'
import i18n from '@/i18n'
import { getMessageApi } from '@/utils/notifier'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import {
  invalidateSession,
  markSessionAuthenticated,
  refreshAccessToken,
} from '@/services/authSession'

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    markSessionAuthenticated()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout']

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
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
        invalidateSession()
      }
      throw error
    }

    if (originalRequest._retry) {
      invalidateSession()
      throw error
    }

    originalRequest._retry = true

    const newToken = await refreshAccessToken()
    if (!originalRequest.headers) {
      originalRequest.headers = {} as AxiosRequestHeaders
    }
    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return axiosInstance(originalRequest)
  },
)
