export interface Tariff {
  id: number
  org_id: number
  price_per_hour: number
  grace_period_minutes: number
  created_at: string
}

export interface UpdateTariffPayload {
  price_per_hour: number
  grace_period_minutes: number
}
