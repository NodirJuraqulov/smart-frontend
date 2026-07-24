import { axiosInstance } from './axiosInstance'
import type {
  CreateSubscriptionPayload,
  Subscription,
  SubscriptionsQueryParams,
} from '@/types/subscription'

interface SubscriptionDto {
  id: number
  org_id: number
  plan_id: number | null
  plate_number: string
  plan_name_snapshot: string
  price_snapshot: number | string
  duration_days_snapshot: number
  start_date: string
  end_date: string
  last_renewed_at: string | null
  status: 'active' | 'expired'
  created_at: string
}

const mapSubscription = (dto: SubscriptionDto): Subscription => ({
  ...dto,
  price_snapshot: Number(dto.price_snapshot),
})

export const getSubscriptions = (params?: SubscriptionsQueryParams) =>
  axiosInstance
    .get<{ subscriptions: SubscriptionDto[] }>('/api/subscriptions', {
      params,
    })
    .then((res) => res.data.subscriptions.map(mapSubscription))

export const createSubscription = (payload: CreateSubscriptionPayload) =>
  axiosInstance
    .post<{ subscription: SubscriptionDto }>('/api/subscriptions', payload)
    .then((res) => mapSubscription(res.data.subscription))

export const updateSubscriptionEndDate = ({
  id,
  end_date,
}: {
  id: number
  end_date: string
}) =>
  axiosInstance
    .put<{ subscription: SubscriptionDto }>(`/api/subscriptions/${id}`, {
      end_date,
    })
    .then((res) => mapSubscription(res.data.subscription))

export const renewSubscription = (id: number) =>
  axiosInstance
    .post<{ subscription: SubscriptionDto }>(`/api/subscriptions/${id}/renew`)
    .then((res) => mapSubscription(res.data.subscription))

export const deleteSubscription = (id: number) =>
  axiosInstance.delete<void>(`/api/subscriptions/${id}`).then(() => undefined)
