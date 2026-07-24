export interface TariffInterval {
  id: number
  org_id: number
  from_minutes: number
  to_minutes: number | null
  price: number
  created_at: string
}

export interface CreateTariffIntervalPayload {
  from_minutes: number
  to_minutes: number | null
  price: number
}

export interface UpdateTariffIntervalPayload {
  from_minutes?: number
  to_minutes?: number | null
  price?: number
}
