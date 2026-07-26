export interface OrgSettings {
  id: number
  org_id: number
  work_hours_enabled: boolean
  work_start: string | null
  work_end: string | null
  created_at: string
}

export interface UpdateSettingsPayload {
  work_hours_enabled?: boolean
  work_start?: string
  work_end?: string
}
