import { axiosInstance } from './axiosInstance'
import type {
  CreateVipVehiclePayload,
  UpdateVipVehiclePayload,
  VipVehicle,
} from '@/types/vipVehicle'

export const getVipVehicles = () =>
  axiosInstance
    .get<{ vehicles: VipVehicle[] }>('/api/vip-vehicles')
    .then((res) => res.data.vehicles)

export const createVipVehicle = (payload: CreateVipVehiclePayload) =>
  axiosInstance
    .post<{ vehicle: VipVehicle }>('/api/vip-vehicles', payload)
    .then((res) => res.data.vehicle)

export const updateVipVehicle = ({
  id,
  ...payload
}: UpdateVipVehiclePayload & { id: number }) =>
  axiosInstance
    .put<{ vehicle: VipVehicle }>(`/api/vip-vehicles/${id}`, payload)
    .then((res) => res.data.vehicle)

export const deleteVipVehicle = (id: number) =>
  axiosInstance.delete<void>(`/api/vip-vehicles/${id}`).then(() => undefined)
