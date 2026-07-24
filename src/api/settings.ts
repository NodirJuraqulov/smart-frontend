import { axiosInstance } from './axiosInstance'
import type { OrgSettings, UpdateSettingsPayload } from '@/types/settings'

interface SettingsDto {
  id: number
  org_id: number
  camera_entry_url: string | null
  camera_exit_url: string | null
  camera_username: string | null
  camera_password_configured: boolean
  last_camera_entry_ok: boolean | null
  last_camera_exit_ok: boolean | null
  barrier_enabled: number
  barrier_mode: 'single' | 'separate'
  barrier_entry_port: string | null
  barrier_exit_port: string | null
  barrier_open_seconds: number
  work_hours_enabled: number
  work_start: string | null
  work_end: string | null
  created_at: string
  agent_api_key?: string | null
}

const mapSettings = (dto: SettingsDto): OrgSettings => ({
  ...dto,
  barrier_enabled: dto.barrier_enabled === 1,
  work_hours_enabled: dto.work_hours_enabled === 1,
})

export const getSettings = (orgId?: number) =>
  axiosInstance
    .get<{ settings: SettingsDto }>('/api/settings', {
      params: orgId ? { org_id: orgId } : undefined,
    })
    .then((res) => mapSettings(res.data.settings))

export const updateSettings = (
  orgId: number,
  payload: UpdateSettingsPayload,
) =>
  axiosInstance
    .put<{ settings: SettingsDto }>('/api/settings', payload, {
      params: { org_id: orgId },
    })
    .then((res) => mapSettings(res.data.settings))

export const testBarrier = (orgId: number, type: 'entry' | 'exit') =>
  axiosInstance
    .post<{ message: string }>('/api/settings/barrier/test', undefined, {
      params: { org_id: orgId, type },
    })
    .then((res) => res.data)

export const generateAgentApiKey = (orgId: number) =>
  axiosInstance
    .post<{ settings: SettingsDto }>(
      '/api/settings/agent-key/generate',
      undefined,
      { params: { org_id: orgId } },
    )
    .then((res) => mapSettings(res.data.settings))
