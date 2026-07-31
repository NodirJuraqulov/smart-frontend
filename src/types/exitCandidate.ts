import type { EntryExitMethod, ExitMethod, SessionSource } from './parking'

export type ExitCandidateStatus =
  | 'pending'
  | 'accepted'
  | 'dismissed'
  | 'expired'

export interface ExitCandidateSessionSummary {
  id: number
  org_id: number
  plate_number: string
  entered_at: string
  exited_at: string | null
  status: 'active' | 'awaiting_payment' | 'completed'
  session_source: SessionSource
  amount: string | null
  duration_minutes: number | null
  entry_method?: EntryExitMethod
  exit_method?: ExitMethod | null
}

export interface ExitCandidate {
  id: number
  org_id: number
  webhook_event_id: number
  detected_plate: string | null
  matched_session_id: number | null
  resolved_session_id: number | null
  confidence: number | null
  camera_event_at: string
  status: ExitCandidateStatus
  resolution_type: 'exact' | 'reassigned' | 'dismissed' | null
  resolved_by: number | null
  resolved_at: string | null
  resolution_note: string | null
  created_at: string
  updated_at: string
  overviewImageUrl: string | null
  vehicleImageUrl: string | null
  plateImageUrl: string | null
  matched_session: ExitCandidateSessionSummary | null
}

export interface ExitCandidatesResponse {
  candidates: ExitCandidate[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface ExitCandidateDetailResponse {
  candidate: ExitCandidate
  suggestions: ExitCandidateSessionSummary[]
}

export interface ExitCandidateResolvedEvent {
  candidateId: number
  status: 'accepted' | 'dismissed'
  resolutionType: 'exact' | 'reassigned' | 'dismissed'
  sessionId: number | null
}
