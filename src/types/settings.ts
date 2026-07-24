export interface OrgSettings {
  id: number
  org_id: number
  camera_entry_url?: string | null
  camera_exit_url?: string | null
  camera_username?: string | null
  camera_password_configured?: boolean
  last_camera_entry_ok: boolean | null
  last_camera_exit_ok: boolean | null
  barrier_enabled: boolean
  barrier_mode: 'single' | 'separate'
  barrier_entry_port?: string | null
  barrier_exit_port?: string | null
  barrier_open_seconds: number
  work_hours_enabled: boolean
  work_start: string | null
  work_end: string | null
  created_at: string
  agent_api_key?: string | null
}

export interface UpdateSettingsPayload {
  camera_entry_url?: string
  camera_exit_url?: string
  camera_username?: string
  camera_password?: string
  barrier_enabled?: boolean
  barrier_mode?: 'single' | 'separate'
  barrier_entry_port?: string
  barrier_exit_port?: string
  barrier_open_seconds?: number
  work_hours_enabled?: boolean
  work_start?: string
  work_end?: string
}
