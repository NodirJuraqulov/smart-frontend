import axios from 'axios'
import type { DisplayStatus } from '@/types/publicDisplay'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'

const publicDisplayClient = axios.create({
  baseURL: API_BASE_URL,
})

export const getDisplayStatus = (orgId: number) =>
  publicDisplayClient
    .get<DisplayStatus>(`/api/public/display/${orgId}/status`)
    .then((res) => res.data)
