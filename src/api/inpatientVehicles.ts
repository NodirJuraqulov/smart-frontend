import { axiosInstance } from './axiosInstance'
import type {
  InpatientVehicle,
  InpatientVehiclesQueryParams,
  InpatientVehiclesResponse,
} from '@/types/inpatientVehicle'

export const getInpatientVehicles = (
  orgId: number,
  params: InpatientVehiclesQueryParams,
) =>
  axiosInstance
    .get<InpatientVehiclesResponse>(
      `/api/organizations/${orgId}/inpatient-vehicles`,
      { params },
    )
    .then((res) => res.data)

export const cancelInpatientVehicle = ({
  orgId,
  vehicleId,
}: {
  orgId: number
  vehicleId: number
}) =>
  axiosInstance
    .post<{ vehicle: InpatientVehicle }>(
      `/api/organizations/${orgId}/inpatient-vehicles/${vehicleId}/cancel`,
    )
    .then((res) => res.data.vehicle)
