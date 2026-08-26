import { axiosInstance } from './axiosInstance'
import type { EmergencyExitHistoryResponse } from '@/types/emergencyExitHistory'

export const getEmergencyExitHistory = (
  orgId: number,
  params: { page: number; limit: number },
) =>
  axiosInstance
    .get<EmergencyExitHistoryResponse>(
      `/api/organizations/${orgId}/emergency-exit-history`,
      { params },
    )
    .then((response) => response.data)
