import type { ExitCandidateBarrierStatus } from './exitCandidate'

export type EntryCandidateReason =
  | 'capacity_full'
  | 'plate_not_detected'
  | 'capacity_full_and_plate_not_detected'

export interface EntryCandidateImages {
  overview_url: string | null
  vehicle_url: string | null
  image_available: boolean
}

export interface EntryCandidateNext {
  candidate_id: number
  detected_plate: string | null
  suggested_plate?: string | null
  camera_event_at: string
  confidence: number | null
  reason: EntryCandidateReason
  entry_images: EntryCandidateImages
  pending_count_for_org: number
}

export interface EntryCandidateAcceptPayload {
  plate_number: string
  note?: string
}

export interface EntryCandidateAcceptResponse {
  session_id: number
  plate: string
  barrier_status: ExitCandidateBarrierStatus
}

export interface EntryCandidateDeclineResponse {
  status: 'declined'
}

export type ManualEntryReason = 'camera_unavailable' | 'other'

export interface ManualParkingEntryPayload {
  plate_number: string
  reason: ManualEntryReason
  note?: string
}

export interface ManualParkingEntryResponse {
  session_id: number
  plate: string
  barrier_status: ExitCandidateBarrierStatus
}

export interface EntryCandidateCreatedEvent {
  candidateId: number
  orgId: number
  detectedPlate: string | null
  cameraEventAt: string
  confidence: number | null
  entryImages: {
    overviewUrl: string | null
    vehicleUrl: string | null
    imageAvailable: boolean
  }
}

export interface EntryCandidateResolvedEvent {
  candidateId: number
  orgId: number
  status: 'accepted' | 'declined' | 'expired'
  sessionId: number | null
  barrierStatus: ExitCandidateBarrierStatus | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isEntryCandidateCreatedEvent = (
  value: unknown,
): value is EntryCandidateCreatedEvent =>
  isRecord(value) &&
  isRecord(value.entryImages) &&
  typeof value.candidateId === 'number' &&
  typeof value.orgId === 'number' &&
  (value.detectedPlate === null || typeof value.detectedPlate === 'string') &&
  typeof value.cameraEventAt === 'string' &&
  (value.confidence === null || typeof value.confidence === 'number') &&
  (value.entryImages.overviewUrl === null ||
    typeof value.entryImages.overviewUrl === 'string') &&
  (value.entryImages.vehicleUrl === null ||
    typeof value.entryImages.vehicleUrl === 'string') &&
  typeof value.entryImages.imageAvailable === 'boolean'

export const isEntryCandidateResolvedEvent = (
  value: unknown,
): value is EntryCandidateResolvedEvent =>
  isRecord(value) &&
  typeof value.candidateId === 'number' &&
  typeof value.orgId === 'number' &&
  (value.status === 'accepted' ||
    value.status === 'declined' ||
    value.status === 'expired') &&
  (value.sessionId === null || typeof value.sessionId === 'number') &&
  (value.barrierStatus === null ||
    value.barrierStatus === 'opened' ||
    value.barrierStatus === 'failed' ||
    value.barrierStatus === 'disabled' ||
    value.barrierStatus === 'not_configured')
