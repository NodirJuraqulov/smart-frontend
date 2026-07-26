import axios from 'axios'
import type { DisplayStatus } from '@/types/publicDisplay'

const publicDisplayClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const getDisplayStatus = (orgId: number) =>
  publicDisplayClient
    .get<DisplayStatus>(`/api/public/display/${orgId}/status`)
    .then((res) => res.data)
