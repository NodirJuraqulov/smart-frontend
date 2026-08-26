import type { PaginationMeta } from './parking'

export type EmergencyExitHistorySource = 'parking_session' | 'exit_candidate'
export type EmergencyExitHistoryType = 'confirmed' | 'forced_open'

export interface EmergencyExitConfirmer {
  id: number
  name: string | null
}

export interface EmergencyExitHistoryItem {
  id: string
  source: EmergencyExitHistorySource
  session_id: number | null
  candidate_id: number | null
  plate_number: string | null
  occurred_at: string
  confirmed_by: EmergencyExitConfirmer | null
  type: EmergencyExitHistoryType
  resolution_note: string | null
  image_url: string | null
}

export interface EmergencyExitHistoryResponse {
  history: EmergencyExitHistoryItem[]
  pagination: PaginationMeta
}
