export interface OperatorPermissions {
  can_view_dashboard: boolean
  can_view_sessions: boolean
  can_view_reports: boolean
  can_view_tariffs: boolean
  can_view_subscriptions: boolean
  can_view_settings: boolean
  can_view_activity_log: boolean
}

export interface PermissionItem {
  section_key: string
  can_view: boolean
}

export type PermissionRole = 'operator' | 'kassir'
