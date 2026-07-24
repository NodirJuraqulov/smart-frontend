import { axiosInstance } from './axiosInstance'
import type {
  ActivityLogsQueryParams,
  ActivityLogsResponse,
} from '@/types/activityLog'

export const getActivityLogs = (params: ActivityLogsQueryParams) =>
  axiosInstance
    .get<ActivityLogsResponse>('/api/admin/activity-logs', { params })
    .then((res) => res.data)
