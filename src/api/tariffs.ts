import { axiosInstance } from './axiosInstance'
import type { Tariff, UpdateTariffPayload } from '@/types/tariff'

interface TariffDto {
  id: number
  org_id: number
  price_per_hour: number | string
  grace_period_minutes: number | string
  created_at: string
}

const mapTariff = (dto: TariffDto): Tariff => ({
  ...dto,
  price_per_hour: Number(dto.price_per_hour),
  grace_period_minutes: Number(dto.grace_period_minutes),
})

export const getTariffs = (orgId?: number) =>
  axiosInstance
    .get<{ tariffs: TariffDto[] }>('/api/tariffs', {
      params: orgId ? { org_id: orgId } : undefined,
    })
    .then((res) => res.data.tariffs.map(mapTariff))

export const updateTariff = ({
  id,
  ...payload
}: UpdateTariffPayload & { id: number }) =>
  axiosInstance
    .put<{ tariff: TariffDto }>(`/api/tariffs/${id}`, payload)
    .then((res) => mapTariff(res.data.tariff))
