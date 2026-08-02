import type { OperatorPermissions } from './permissions'
import type { PricingMode } from './organization'

export type UserRole = 'operator' | 'owner' | 'super_admin'

export interface AuthUser {
  id: string
  org_id: number | null
  name: string
  role: UserRole
  org_name?: string | null
  permissions: OperatorPermissions
  pricing_mode: PricingMode | null
}

export interface AuthUserDto {
  id: string
  org_id: number | null
  name: string
  role: UserRole
  org_name?: string | null
  pricing_mode: PricingMode | null
}

export interface AuthPermissionsDto {
  dashboard: boolean
  sessions: boolean
  reports: boolean
  tariffs: boolean
  subscriptions: boolean
  settings: boolean
  activity_log: boolean
}

export interface LoginPayload {
  login: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: AuthUser
}

export interface LoginResponseDto {
  token: string
  refreshToken: string
  user: AuthUserDto
  permissions?: AuthPermissionsDto
}

export interface RefreshResponse {
  token: string
  refreshToken?: string
}

export interface MeResponseDto {
  user: AuthUserDto
  permissions?: AuthPermissionsDto
}

export interface LogoutResponse {
  message: string
}
