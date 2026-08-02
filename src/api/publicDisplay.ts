import axios from 'axios'
import type {
  DisplayStatus,
  EntryDisplayFlowStatus,
  ExitDisplayFlowStatus,
} from '@/types/publicDisplay'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'

const publicDisplayClient = axios.create({
  baseURL: API_BASE_URL,
})

export const getDisplayStatus = (orgId: number) =>
  publicDisplayClient
    .get<DisplayStatus>(`/api/public/display/${orgId}/status`)
    .then((res) => res.data)

export const getEntryDisplayStatus = (orgId: number) =>
  publicDisplayClient
    .get<EntryDisplayFlowStatus>(`/api/public/display/${orgId}/entry-status`)
    .then((res) => res.data)

export const getExitDisplayStatus = (orgId: number) =>
  publicDisplayClient
    .get<ExitDisplayFlowStatus>(`/api/public/display/${orgId}/exit-status`)
    .then((res) => res.data)
