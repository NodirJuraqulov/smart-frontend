import { axiosInstance } from './axiosInstance'
import type { OrgSettings, UpdateSettingsPayload } from '@/types/settings'

interface SettingsDto {
  id: number
  org_id: number
  work_hours_enabled: number
  work_start: string | null
  work_end: string | null
  created_at: string
}

const mapSettings = (dto: SettingsDto): OrgSettings => ({
  ...dto,
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
