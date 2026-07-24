import { axiosInstance } from './axiosInstance'
import type {
  CreateSubscriptionPlanPayload,
  SubscriptionPlan,
  UpdateSubscriptionPlanPayload,
} from '@/types/subscriptionPlan'

interface SubscriptionPlanDto {
  id: number
  org_id: number
  name: string
  duration_days: number
  price: number | string
  is_blocked: boolean
  created_at: string
  updated_at: string
}

const mapPlan = (dto: SubscriptionPlanDto): SubscriptionPlan => ({
  ...dto,
  price: Number(dto.price),
})

export const getSubscriptionPlans = () =>
  axiosInstance
    .get<{ plans: SubscriptionPlanDto[] }>('/api/subscription-plans')
    .then((res) => res.data.plans.map(mapPlan))

export const createSubscriptionPlan = (
  payload: CreateSubscriptionPlanPayload,
) =>
  axiosInstance
    .post<{ plan: SubscriptionPlanDto }>('/api/subscription-plans', payload)
    .then((res) => mapPlan(res.data.plan))

export const updateSubscriptionPlan = ({
  id,
  ...payload
}: UpdateSubscriptionPlanPayload & { id: number }) =>
  axiosInstance
    .put<{ plan: SubscriptionPlanDto }>(
      `/api/subscription-plans/${id}`,
      payload,
    )
    .then((res) => mapPlan(res.data.plan))

export const deleteSubscriptionPlan = (id: number) =>
  axiosInstance
    .delete<void>(`/api/subscription-plans/${id}`)
    .then(() => undefined)
