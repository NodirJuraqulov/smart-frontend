import type { PaginationMeta } from './parking'

export interface BlacklistedVehicle {
  id: number
  org_id: number
  plate_number: string
  reason: string | null
  created_by: number | null
  created_at: string
}

export interface CreateBlacklistedVehiclePayload {
  plate_number: string
  reason?: string
}

export interface BlacklistAttempt {
  id: number
  org_id: number
  plate_number: string
  attempted_at: string
  image_url: string | null
  direction: 'entry'
}

export interface BlacklistAttemptsResponse {
  attempts: BlacklistAttempt[]
  pagination: PaginationMeta
}

export interface BlacklistAttemptEvent {
  attemptId: number
  orgId: number
  plateNumber: string
  attemptedAt: string
  imageUrl: string | null
}

export function isBlacklistAttemptEvent(
  value: unknown,
): value is BlacklistAttemptEvent {
  if (typeof value !== 'object' || value === null) return false
  const payload = value as Record<string, unknown>
  return (
    typeof payload.attemptId === 'number' &&
    typeof payload.orgId === 'number' &&
    typeof payload.plateNumber === 'string' &&
    typeof payload.attemptedAt === 'string' &&
    (payload.imageUrl === null || typeof payload.imageUrl === 'string')
  )
}
