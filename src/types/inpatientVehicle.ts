import type { PaginationMeta } from './parking'

export type InpatientVehicleStatus = 'active' | 'expired' | 'cancelled'

export interface InpatientVehicle {
  id: number
  org_id: number
  plate_number: string
  patient_reference: string | null
  patient_name: string | null
  valid_from: string
  valid_until: string
  status: InpatientVehicleStatus
  created_at: string
  cancelled_by: number | null
  cancelled_at: string | null
}

export interface InpatientVehiclesQueryParams {
  status: 'active' | 'all'
  page?: number
  limit?: number
}

export interface InpatientVehiclesResponse {
  vehicles: InpatientVehicle[]
  pagination: PaginationMeta
}
