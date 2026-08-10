export interface CashCollectionPendingSummary {
  expected_cash_amount: number
  online_amount: number
  period_start: string
  period_end: string
}

export interface CashCollection {
  id: number
  org_id: number
  collected_by: number | null
  collected_by_name?: string | null
  expected_amount: number
  collected_amount: number
  online_amount_snapshot: number
  note: string | null
  period_start: string
  period_end: string
  created_at: string
}

export interface CashCollectionsPagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface CashCollectionsResponse {
  collections: CashCollection[]
  pagination: CashCollectionsPagination
}

export interface CreateCashCollectionPayload {
  collected_amount: number
  note?: string
}

export interface CashCollectionsQueryParams {
  page?: number
  limit?: number
}
