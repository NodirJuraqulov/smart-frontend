import { axiosInstance } from './axiosInstance'
import type { AdminStats } from '@/types/adminStats'

export const getAdminStats = () =>
  axiosInstance.get<AdminStats>('/api/admin/stats').then((res) => res.data)
