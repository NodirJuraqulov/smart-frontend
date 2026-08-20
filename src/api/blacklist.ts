import { axiosInstance } from './axiosInstance'
import type {
  BlacklistedVehicle,
  BlacklistAttemptsResponse,
  CreateBlacklistedVehiclePayload,
} from '@/types/blacklist'

const blacklistPath = (orgId: number) =>
  `/api/organizations/${orgId}/blacklist`

export const getBlacklistedVehicles = (orgId: number) =>
  axiosInstance
    .get<{ vehicles: BlacklistedVehicle[] }>(blacklistPath(orgId))
    .then((response) => response.data.vehicles)

export const createBlacklistedVehicle = ({
  orgId,
  ...payload
}: CreateBlacklistedVehiclePayload & { orgId: number }) =>
  axiosInstance
    .post<{ vehicle: BlacklistedVehicle }>(blacklistPath(orgId), payload)
    .then((response) => response.data.vehicle)

export const deleteBlacklistedVehicle = ({
  orgId,
  blacklistId,
}: {
  orgId: number
  blacklistId: number
}) =>
  axiosInstance
    .delete<void>(`${blacklistPath(orgId)}/${blacklistId}`)
    .then(() => undefined)

export const getBlacklistAttempts = (
  orgId: number,
  params: { page: number; limit: number },
) =>
  axiosInstance
    .get<BlacklistAttemptsResponse>(
      `/api/organizations/${orgId}/blacklist-attempts`,
      { params },
    )
    .then((response) => response.data)
