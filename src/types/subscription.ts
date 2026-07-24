export type SubscriptionStatus = 'active' | 'expired'

export interface Subscription {
  id: number
  org_id: number
  plan_id: number | null
  plate_number: string
  plan_name_snapshot: string
  price_snapshot: number
  duration_days_snapshot: number
  start_date: string
  end_date: string
  last_renewed_at: string | null
  status: SubscriptionStatus
  created_at: string
}

export interface CreateSubscriptionPayload {
  plate_number: string
  plan_id: number
}

export interface SubscriptionsQueryParams {
  plan_id?: number
  status?: SubscriptionStatus
  plate_number?: string
}
