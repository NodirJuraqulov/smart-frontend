export interface ActivityLog {
  id: number
  action: string
  target_type: string
  target_id: number | null
  details: Record<string, unknown> | null
  created_at: string
  actor_name: string
}

export interface ActivityLogsQueryParams {
  page?: number
  limit?: number
  action?: string
  target_type?: string
  date?: string
}

export interface ActivityLogsPaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ActivityLogsResponse {
  logs: ActivityLog[]
  pagination: ActivityLogsPaginationMeta
}
