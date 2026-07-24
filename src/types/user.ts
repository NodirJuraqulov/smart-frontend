import type { UserRole } from './auth'

export interface Operator {
  id: number
  org_id: number | null
  name: string
  login: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface CreateOperatorPayload {
  name: string
  login: string
  password: string
  org_id: number
}

export interface UpdateOperatorPayload {
  name?: string
  login?: string
  org_id?: number
}
