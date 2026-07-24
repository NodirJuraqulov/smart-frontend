import { axiosInstance } from './axiosInstance'
import { mapAuthUser } from './mappers'
import type {
  LoginPayload,
  LoginResponse,
  LoginResponseDto,
  LogoutResponse,
  MeResponseDto,
  RefreshResponse,
} from '@/types/auth'

export const login = (payload: LoginPayload) =>
  axiosInstance
    .post<LoginResponseDto>('/api/auth/login', payload)
    .then(
      (res): LoginResponse => ({
        token: res.data.token,
        refreshToken: res.data.refreshToken,
        user: mapAuthUser(res.data.user, res.data.permissions),
      }),
    )

export const fetchCurrentUser = () =>
  axiosInstance
    .get<MeResponseDto>('/api/auth/me')
    .then((res) => mapAuthUser(res.data.user, res.data.permissions))

export const refreshAccessToken = (refreshToken: string) =>
  axiosInstance
    .post<RefreshResponse>('/api/auth/refresh', { refreshToken })
    .then((res) => res.data)

export const logout = (refreshToken: string | null) =>
  axiosInstance
    .post<LogoutResponse>('/api/auth/logout', { refreshToken })
    .then((res) => res.data)
