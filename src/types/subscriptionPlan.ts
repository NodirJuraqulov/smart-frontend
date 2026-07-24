export interface SubscriptionPlan {
  id: number
  org_id: number
  name: string
  duration_days: number
  price: number
  is_blocked: boolean
  created_at: string
  updated_at: string
}

export interface CreateSubscriptionPlanPayload {
  name: string
  duration_days: number
  price: number
}

export interface UpdateSubscriptionPlanPayload {
  name?: string
  duration_days?: number
  price?: number
  is_blocked?: boolean
}
