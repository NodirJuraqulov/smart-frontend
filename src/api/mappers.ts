import type { Operator } from '@/types/user'
import type { IntegrationSettings, Organization } from '@/types/organization'
import type { AuthPermissionsDto, AuthUser, AuthUserDto } from '@/types/auth'
import type { OperatorPermissions } from '@/types/permissions'

export interface OperatorDto {
  id: number
  org_id: number | null
  name: string
  login: string
  role: Operator['role']
  is_active: number
  created_at: string
}

export const mapOperator = (dto: OperatorDto): Operator => ({
  ...dto,
  is_active: dto.is_active === 1,
})

export interface OrganizationDto {
  id: number
  name: string
  address: string | null
  is_active: number
  is_online: boolean
  pricing_mode: Organization['pricing_mode']
  capacity_total: number | null
  created_at: string
}

export const mapOrganization = (dto: OrganizationDto): Organization => ({
  ...dto,
  is_active: dto.is_active === 1,
})

export const mapAuthPermissions = (
  dto: AuthPermissionsDto | undefined,
): OperatorPermissions => {
  if (!dto) {
    return {
      can_view_dashboard: true,
      can_view_sessions: true,
      can_view_reports: true,
      can_view_tariffs: true,
      can_view_subscriptions: true,
      can_view_settings: true,
      can_view_activity_log: true,
    }
  }

  return {
    can_view_dashboard: dto.dashboard,
    can_view_sessions: dto.sessions,
    can_view_reports: dto.reports,
    can_view_tariffs: dto.tariffs,
    can_view_subscriptions: dto.subscriptions,
    can_view_settings: dto.settings,
    can_view_activity_log: dto.activity_log,
  }
}

export interface IntegrationSettingsDto {
  relayEntryIp: string | null
  relayExitIp: string | null
  printerIp: string | null
  cameraBrand: string | null
  webhookToken: string | null
  webhookEntryUrl: string | null
  webhookExitUrl: string | null
  lastWebhookEntryAt?: string | null
  lastWebhookExitAt?: string | null
}

export const mapIntegrationSettings = (
  dto: IntegrationSettingsDto,
): IntegrationSettings => ({
  relay_entry_ip: dto.relayEntryIp,
  relay_exit_ip: dto.relayExitIp,
  printer_ip: dto.printerIp,
  camera_brand: dto.cameraBrand,
  webhook_token: dto.webhookToken,
  webhook_entry_url: dto.webhookEntryUrl,
  webhook_exit_url: dto.webhookExitUrl,
  last_webhook_entry_at: dto.lastWebhookEntryAt ?? null,
  last_webhook_exit_at: dto.lastWebhookExitAt ?? null,
})

export const mapAuthUser = (
  user: AuthUserDto,
  permissions: AuthPermissionsDto | undefined,
): AuthUser => ({
  ...user,
  permissions: mapAuthPermissions(permissions),
})
