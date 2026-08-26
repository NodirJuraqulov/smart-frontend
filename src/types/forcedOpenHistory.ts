import type { PaginationMeta } from './parking'

export interface ForcedOpenResolver {
  id: number
  name: string | null
}

export interface ForcedOpenHistoryItem {
  id: number
  plate_number: string | null
  resolved_at: string
  resolved_by: ForcedOpenResolver | null
  resolution_note: string | null
  is_emergency: boolean
  image_url: string | null
}

export interface ForcedOpenHistoryResponse {
  history: ForcedOpenHistoryItem[]
  pagination: PaginationMeta
}
