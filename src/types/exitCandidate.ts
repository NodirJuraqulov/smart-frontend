import type { PaymentMethod, SessionSource } from './parking'

export interface ExitCandidateImages {
  overview_url: string | null
  vehicle_url: string | null
  image_available: boolean
}

export interface ExitCandidateMatchedSession {
  session_id: string
  plate_number: string | null
  session_source: SessionSource
  entered_at: string
  entry_images: ExitCandidateImages
  duration_minutes: number
  tariff_snapshot_amount: number
}

export interface ExitCandidateNext {
  candidate_id: string
  status: 'pending'
  webhook_event_id: string
  detected_plate: string | null
  camera_event_at: string
  exit_images: ExitCandidateImages
  matched_session: ExitCandidateMatchedSession | null
  pending_count_for_org: number
}

export interface ExitCandidateSessionOption {
  session_id: string
  plate_number: string | null
  entered_at: string
  session_source: SessionSource
  entry_images: ExitCandidateImages
  duration_minutes: number
  tariff_snapshot_amount: number
}

export interface ExitCandidateSearchResult extends ExitCandidateSessionOption {
  similarity_score: number
}

export type ExitCandidateActiveSession = ExitCandidateSessionOption

export interface ExitCandidateSearchResponse {
  results: ExitCandidateSearchResult[]
  active_sessions: ExitCandidateActiveSession[]
}

export interface ExitCandidateConfirmPayload {
  session_id?: string
  payment_method?: PaymentMethod
}

export interface ExitCandidateConfirmResponse {
  session_id: string
  plate: string
  amount: number
  payment_method: PaymentMethod | null
  barrier_status: ExitCandidateBarrierStatus
}

export type ExitCandidateForceReason =
  | 'plate_not_found'
  | 'camera_misread'
  | 'no_session'
  | 'technical_issue'
  | 'emergency'
  | 'other'

export interface ExitCandidateForceOpenPayload {
  reason: ExitCandidateForceReason
  note?: string
  entered_plate?: string
}

export interface ExitCandidateBarrierResponse {
  barrier_status: ExitCandidateBarrierStatus
}

export type ExitCandidateBarrierStatus =
  | 'opened'
  | 'failed'
  | 'disabled'
  | 'not_configured'

export interface ExitCandidateCreatedImages {
  overviewUrl: string | null
  vehicleUrl: string | null
  plateUrl: string | null
}

export interface ExitCandidateCreatedEvent {
  candidateId: number
  orgId: number
  webhookEventId: number
  detectedPlate: string | null
  matchedSessionId: number | null
  confidence: number | null
  cameraEventAt: string
  status: 'pending'
  exitImages: ExitCandidateCreatedImages
}

export interface ExitCandidateResolvedEvent {
  candidateId: number
  orgId: number
  status: 'accepted' | 'dismissed'
  resolutionType: 'exact' | 'reassigned' | 'dismissed' | 'forced_open'
  sessionId: number | null
  barrierStatus: ExitCandidateBarrierStatus | null
}

export interface ExitCompletedEvent {
  orgId: number
  sessionId: number
  plateNumber: string
  amount: number
  paymentMethod: PaymentMethod | null
  barrierStatus: ExitCandidateBarrierStatus
}

const barrierStatuses: ExitCandidateBarrierStatus[] = [
  'opened',
  'failed',
  'disabled',
  'not_configured',
]

const resolutionTypes: ExitCandidateResolvedEvent['resolutionType'][] = [
  'exact',
  'reassigned',
  'dismissed',
  'forced_open',
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNullableString = (value: unknown) =>
  value === null || typeof value === 'string'

const isNullableNumber = (value: unknown) =>
  value === null || typeof value === 'number'

export const isExitCandidateBarrierStatus = (
  value: unknown,
): value is ExitCandidateBarrierStatus =>
  barrierStatuses.includes(value as ExitCandidateBarrierStatus)

export function isExitCandidateCreatedEvent(
  value: unknown,
): value is ExitCandidateCreatedEvent {
  if (!isRecord(value) || !isRecord(value.exitImages)) return false
  return (
    typeof value.candidateId === 'number' &&
    typeof value.orgId === 'number' &&
    typeof value.webhookEventId === 'number' &&
    isNullableString(value.detectedPlate) &&
    isNullableNumber(value.matchedSessionId) &&
    isNullableNumber(value.confidence) &&
    typeof value.cameraEventAt === 'string' &&
    value.status === 'pending' &&
    isNullableString(value.exitImages.overviewUrl) &&
    isNullableString(value.exitImages.vehicleUrl) &&
    isNullableString(value.exitImages.plateUrl)
  )
}

export function isExitCandidateResolvedEvent(
  value: unknown,
): value is ExitCandidateResolvedEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.candidateId === 'number' &&
    typeof value.orgId === 'number' &&
    (value.status === 'accepted' || value.status === 'dismissed') &&
    resolutionTypes.includes(
      value.resolutionType as ExitCandidateResolvedEvent['resolutionType'],
    ) &&
    isNullableNumber(value.sessionId) &&
    (value.barrierStatus === null ||
      isExitCandidateBarrierStatus(value.barrierStatus))
  )
}

export function isExitCompletedEvent(
  value: unknown,
): value is ExitCompletedEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.orgId === 'number' &&
    typeof value.sessionId === 'number' &&
    typeof value.plateNumber === 'string' &&
    typeof value.amount === 'number' &&
    (value.paymentMethod === null ||
      value.paymentMethod === 'cash' ||
      value.paymentMethod === 'online') &&
    isExitCandidateBarrierStatus(value.barrierStatus)
  )
}
