import { axiosInstance } from './axiosInstance'
import {
  mapIntegrationSettings,
  mapOperator,
  mapOrganization,
  type IntegrationSettingsDto,
  type OperatorDto,
  type OrganizationDto,
} from './mappers'
import type {
  CameraRelaySettings,
  CreateOrganizationPayload,
  EmergencyBarrierOpenParams,
  EmergencyBarrierOpenResponse,
  GateLayout,
  OrganizationStats,
  PricingMode,
  UpdateIntegrationSettingsPayload,
  UpdateCameraRelaySettingsPayload,
  UpdateOrganizationPayload,
} from '@/types/organization'
import type {
  CreateTariffIntervalPayload,
  TariffInterval,
  UpdateTariffIntervalPayload,
} from '@/types/tariffInterval'
import type { OperatorPermissions, PermissionItem } from '@/types/permissions'

export const getOrganizations = () =>
  axiosInstance
    .get<{ organizations: OrganizationDto[] }>('/api/admin/organizations')
    .then((res) => res.data.organizations.map(mapOrganization))

export const createOrganization = (payload: CreateOrganizationPayload) =>
  axiosInstance
    .post<{ organization: OrganizationDto; operator?: OperatorDto | null }>(
      '/api/admin/organizations',
      payload,
    )
    .then((res) => ({
      organization: mapOrganization(res.data.organization),
      operator: res.data.operator ? mapOperator(res.data.operator) : null,
    }))

export const updateOrganization = ({
  id,
  ...payload
}: UpdateOrganizationPayload & { id: number }) =>
  axiosInstance
    .put<{ organization: OrganizationDto }>(
      `/api/admin/organizations/${id}`,
      payload,
    )
    .then((res) => mapOrganization(res.data.organization))

export const toggleOrgBlock = ({
  id,
  is_active,
}: {
  id: number
  is_active: boolean
}) =>
  axiosInstance
    .patch<{ organization: OrganizationDto }>(
      `/api/admin/organizations/${id}/block`,
      { is_active },
    )
    .then((res) => mapOrganization(res.data.organization))

export const getOrgStats = (id: number) =>
  axiosInstance
    .get<OrganizationStats>(`/api/admin/organizations/${id}/stats`)
    .then((res) => res.data)

export const getIntegrationSettings = (orgId: number) =>
  axiosInstance
    .get<IntegrationSettingsDto>(
      `/api/admin/organizations/${orgId}/integration-settings`,
    )
    .then((res) => mapIntegrationSettings(res.data))

export const updateIntegrationSettings = ({
  orgId,
  ...payload
}: UpdateIntegrationSettingsPayload & { orgId: number }) =>
  axiosInstance
    .put<IntegrationSettingsDto>(
      `/api/admin/organizations/${orgId}/integration-settings`,
      payload,
    )
    .then((res) => mapIntegrationSettings(res.data))

export const regenerateWebhookToken = (orgId: number) =>
  axiosInstance
    .post<{ webhookToken: string }>(
      `/api/admin/organizations/${orgId}/integration-settings/regenerate-token`,
    )
    .then((res) => res.data.webhookToken)

export const testRelay = ({
  orgId,
  direction,
}: {
  orgId: number
  direction: 'entry' | 'exit'
}) =>
  axiosInstance
    .post<{ success: boolean }>(
      `/api/admin/organizations/${orgId}/relay/test`,
      { direction },
    )
    .then((res) => res.data.success)

export const testPrinter = (orgId: number) =>
  axiosInstance
    .post<{ success: boolean; reason?: string }>(
      `/api/admin/organizations/${orgId}/printer/test`,
    )
    .then((res) => res.data)

export const getCameraRelaySettings = (orgId: number) =>
  axiosInstance
    .get<CameraRelaySettings>(
      `/api/organizations/${orgId}/camera-relay-settings`,
    )
    .then((res) => res.data)

export const getOrganizationGateLayout = (orgId: number) =>
  axiosInstance
    .get<{ gate_layout: GateLayout }>(
      `/api/organizations/${orgId}/gate-layout`,
    )
    .then((res) => res.data)

export const updateCameraRelaySettings = ({
  orgId,
  ...payload
}: UpdateCameraRelaySettingsPayload & { orgId: number }) =>
  axiosInstance
    .patch<CameraRelaySettings>(
      `/api/organizations/${orgId}/camera-relay-settings`,
      payload,
    )
    .then((res) => res.data)

export const openEmergencyBarrier = ({
  orgId,
  direction,
  reason,
}: EmergencyBarrierOpenParams) => {
  const normalizedReason = reason?.trim()
  return axiosInstance
    .post<EmergencyBarrierOpenResponse>(
      `/api/organizations/${orgId}/emergency-barrier-open`,
      {
        direction,
        ...(normalizedReason ? { reason: normalizedReason } : {}),
      },
    )
    .then((res) => res.data)
}

export const createOrganizationOperator = ({
  id,
  ...payload
}: {
  id: number
  name: string
  login: string
  password: string
}) =>
  axiosInstance
    .post<{ operator: OperatorDto }>(
      `/api/admin/organizations/${id}/operator`,
      payload,
    )
    .then((res) => mapOperator(res.data.operator))

export const updatePricingMode = ({
  id,
  pricing_mode,
}: {
  id: number
  pricing_mode: PricingMode
}) =>
  axiosInstance
    .put<{ organization: OrganizationDto }>(
      `/api/admin/organizations/${id}/pricing-mode`,
      { pricing_mode },
    )
    .then((res) => mapOrganization(res.data.organization))

export const updateCapacity = ({
  id,
  capacity_total,
}: {
  id: number
  capacity_total: number | null
}) =>
  axiosInstance
    .put<{ organization: OrganizationDto }>(
      `/api/admin/organizations/${id}/capacity`,
      {
        total_capacity:
          capacity_total === null ? null : Math.trunc(Number(capacity_total)),
      },
    )
    .then((res) => mapOrganization(res.data.organization))

const PERMISSION_SECTIONS: [keyof OperatorPermissions, string][] = [
  ['can_view_dashboard', 'dashboard'],
  ['can_view_sessions', 'sessions'],
  ['can_view_reports', 'reports'],
  ['can_view_tariffs', 'tariffs'],
  ['can_view_subscriptions', 'subscriptions'],
  ['can_view_settings', 'settings'],
  ['can_view_activity_log', 'activity_log'],
]

export const mapPermissionsFromDto = (
  items: PermissionItem[],
): OperatorPermissions => {
  const bySection: Record<string, boolean> = Object.fromEntries(
    items.map((item) => [item.section_key, item.can_view]),
  )
  return PERMISSION_SECTIONS.reduce((acc, [key, section]) => {
    acc[key] = bySection[section] ?? false
    return acc
  }, {} as OperatorPermissions)
}

export const mapPermissionsToDto = (
  permissions: OperatorPermissions,
): PermissionItem[] =>
  PERMISSION_SECTIONS.map(([key, section]) => ({
    section_key: section,
    can_view: permissions[key],
  }))

export const getPermissions = (id: number) =>
  axiosInstance
    .get<{ permissions: PermissionItem[] }>(
      `/api/admin/organizations/${id}/permissions`,
    )
    .then((res) => mapPermissionsFromDto(res.data.permissions))

export const updatePermissions = ({
  id,
  permissions,
}: {
  id: number
  permissions: OperatorPermissions
}) =>
  axiosInstance
    .put<{ permissions: PermissionItem[] }>(
      `/api/admin/organizations/${id}/permissions`,
      { permissions: mapPermissionsToDto(permissions) },
    )
    .then((res) => mapPermissionsFromDto(res.data.permissions))

interface TariffIntervalDto {
  id: number
  org_id: number
  from_minutes: number
  to_minutes: number | null
  price: number | string
  created_at: string
}

const mapTariffInterval = (dto: TariffIntervalDto): TariffInterval => ({
  ...dto,
  price: Number(dto.price),
})

export const getTariffIntervals = () =>
  axiosInstance
    .get<{ intervals: TariffIntervalDto[] }>('/api/tariff-intervals')
    .then((res) => res.data.intervals.map(mapTariffInterval))

export const createTariffInterval = (payload: CreateTariffIntervalPayload) =>
  axiosInstance
    .post<{ interval: TariffIntervalDto }>('/api/tariff-intervals', payload)
    .then((res) => mapTariffInterval(res.data.interval))

export const updateTariffInterval = ({
  id,
  ...payload
}: UpdateTariffIntervalPayload & { id: number }) =>
  axiosInstance
    .put<{ interval: TariffIntervalDto }>(
      `/api/tariff-intervals/${id}`,
      payload,
    )
    .then((res) => mapTariffInterval(res.data.interval))

export const deleteTariffInterval = (id: number) =>
  axiosInstance
    .delete<void>(`/api/tariff-intervals/${id}`)
    .then(() => undefined)

export const getTariffIntervalsAdmin = (orgId: number) =>
  axiosInstance
    .get<{ intervals: TariffIntervalDto[] }>(
      `/api/admin/organizations/${orgId}/tariff-intervals`,
    )
    .then((res) => res.data.intervals.map(mapTariffInterval))

export const createTariffIntervalAdmin = ({
  orgId,
  ...payload
}: CreateTariffIntervalPayload & { orgId: number }) =>
  axiosInstance
    .post<{ interval: TariffIntervalDto }>(
      `/api/admin/organizations/${orgId}/tariff-intervals`,
      payload,
    )
    .then((res) => mapTariffInterval(res.data.interval))

export const updateTariffIntervalAdmin = ({
  orgId,
  id,
  ...payload
}: UpdateTariffIntervalPayload & { orgId: number; id: number }) =>
  axiosInstance
    .put<{ interval: TariffIntervalDto }>(
      `/api/admin/organizations/${orgId}/tariff-intervals/${id}`,
      payload,
    )
    .then((res) => mapTariffInterval(res.data.interval))

export const deleteTariffIntervalAdmin = ({
  orgId,
  id,
}: {
  orgId: number
  id: number
}) =>
  axiosInstance
    .delete<void>(`/api/admin/organizations/${orgId}/tariff-intervals/${id}`)
    .then(() => undefined)
