export type PricingMode = 'hourly' | 'interval'

export interface Organization {
  id: number
  name: string
  address: string | null
  is_active: boolean
  is_online: boolean
  pricing_mode: PricingMode
  capacity_total: number | null
  created_at: string
}

export interface CreateOrganizationPayload {
  name: string
  address?: string
  owner: {
    name: string
    login: string
    password: string
  }
  operator?: {
    name: string
    login: string
    password: string
  }
  tariff: {
    price_per_hour: number
    grace_period_minutes?: number
  }
}

export interface UpdateOrganizationPayload {
  name?: string
  address?: string
}

export interface OrganizationStats {
  organization_id: number
  today_entries: number
  today_exits: number
  today_revenue: number
  currently_parked: number
  total_sessions: number
  total_revenue: number
  is_online: boolean
  last_heartbeat_at: string | null
}

export interface IntegrationSettings {
  relay_entry_ip: string | null
  relay_exit_ip: string | null
  printer_ip: string | null
  camera_brand: string | null
  webhook_token: string | null
  webhook_entry_url: string | null
  webhook_exit_url: string | null
  webhook_debug_entry_url: string | null
  webhook_debug_exit_url: string | null
  last_webhook_entry_at: string | null
  last_webhook_exit_at: string | null
}

export interface UpdateIntegrationSettingsPayload {
  relay_entry_ip?: string | null
  relay_exit_ip?: string | null
  printer_ip?: string | null
  camera_brand?: string | null
}
