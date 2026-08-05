import type { PaginationMeta } from './parking'

export type ClinicDiscountStatus = 'pending' | 'used' | 'expired' | 'cancelled'

export interface ClinicDiscount {
  id: number
  org_id: number
  plate_number: string
  discount_percent: number
  status: ClinicDiscountStatus
  source_reference: string | null
  created_at: string
  used_at: string | null
  used_session_id: number | null
  cancelled_by: number | null
  cancelled_at: string | null
}

export interface ClinicDiscountsQueryParams {
  status: 'pending' | 'all'
  page?: number
  limit?: number
}

export interface ClinicDiscountsResponse {
  discounts: ClinicDiscount[]
  pagination: PaginationMeta
}

export interface ClinicDiscountSettings {
  clinic_discount_percent: number
}
