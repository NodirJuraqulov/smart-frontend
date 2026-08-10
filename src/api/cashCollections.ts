import { axiosInstance } from './axiosInstance'
import type {
  CashCollection,
  CashCollectionPendingSummary,
  CashCollectionsPagination,
  CashCollectionsQueryParams,
  CashCollectionsResponse,
  CreateCashCollectionPayload,
} from '@/types/cashCollection'

interface CashCollectionDto {
  id: number
  org_id: number
  collected_by: number | null
  collected_by_name?: string | null
  expected_amount: string | number
  collected_amount: string | number
  online_amount_snapshot: string | number
  note: string | null
  period_start: string
  period_end: string
  created_at: string
}

interface PendingSummaryDto {
  expected_cash_amount: string | number
  online_amount: string | number
  period_start: string
  period_end: string
}

const toAmount = (value: string | number | null | undefined): number => {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

const mapCashCollection = (dto: CashCollectionDto): CashCollection => ({
  ...dto,
  expected_amount: toAmount(dto.expected_amount),
  collected_amount: toAmount(dto.collected_amount),
  online_amount_snapshot: toAmount(dto.online_amount_snapshot),
})

const mapPendingSummary = (
  dto: PendingSummaryDto,
): CashCollectionPendingSummary => ({
  expected_cash_amount: toAmount(dto.expected_cash_amount),
  online_amount: toAmount(dto.online_amount),
  period_start: dto.period_start,
  period_end: dto.period_end,
})

export const getCashCollectionPendingSummary = (orgId: number) =>
  axiosInstance
    .get<PendingSummaryDto>(
      `/api/organizations/${orgId}/cash-collections/pending-summary`,
    )
    .then((res) => mapPendingSummary(res.data))

export const createCashCollection = ({
  orgId,
  ...payload
}: CreateCashCollectionPayload & { orgId: number }) =>
  axiosInstance
    .post<{ collection: CashCollectionDto }>(
      `/api/organizations/${orgId}/cash-collections`,
      payload,
    )
    .then((res) => mapCashCollection(res.data.collection))

export const getCashCollections = ({
  orgId,
  ...params
}: CashCollectionsQueryParams & { orgId: number }) =>
  axiosInstance
    .get<{
      collections: CashCollectionDto[]
      pagination: CashCollectionsPagination
    }>(`/api/organizations/${orgId}/cash-collections`, { params })
    .then(
      (res): CashCollectionsResponse => ({
        collections: res.data.collections.map(mapCashCollection),
        pagination: res.data.pagination,
      }),
    )
