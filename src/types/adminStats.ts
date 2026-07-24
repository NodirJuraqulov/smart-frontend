export interface TopOrganization {
  id: number
  name: string
  today_revenue: number
  currently_parked: number
}

export interface AdminStats {
  total_organizations: number
  active_organizations: number
  total_revenue_today: number
  total_revenue_monthly: number
  total_currently_parked: number
  offline_organizations_count: number
  top_organizations: TopOrganization[]
}
