import { axiosInstance } from './axiosInstance'
import type { ForcedOpenHistoryResponse } from '@/types/forcedOpenHistory'

export const getForcedOpenHistory = (
  orgId: number,
  params: { page: number; limit: number },
) =>
  axiosInstance
    .get<ForcedOpenHistoryResponse>(
      `/api/organizations/${orgId}/forced-open-history`,
      { params },
    )
    .then((response) => response.data)
