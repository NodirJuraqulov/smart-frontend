import { axiosInstance } from './axiosInstance'
import type {
  ExitCandidate,
  ExitCandidateDetailResponse,
  ExitCandidatesResponse,
} from '@/types/exitCandidate'

export const getExitCandidates = () =>
  axiosInstance
    .get<ExitCandidatesResponse>('/api/exit-candidates', {
      params: { page: 1, limit: 100 },
    })
    .then((res) => res.data)

export const getExitCandidate = (id: number) =>
  axiosInstance
    .get<ExitCandidateDetailResponse>(`/api/exit-candidates/${id}`)
    .then((res) => res.data)

export const acceptExitCandidate = (id: number) =>
  axiosInstance
    .post<{ candidate: ExitCandidate }>(`/api/exit-candidates/${id}/accept`)
    .then((res) => res.data.candidate)

export const reassignExitCandidate = (id: number, sessionId: number) =>
  axiosInstance
    .post<{ candidate: ExitCandidate }>(
      `/api/exit-candidates/${id}/reassign`,
      { session_id: sessionId },
    )
    .then((res) => res.data.candidate)

export const dismissExitCandidate = (id: number, note?: string) =>
  axiosInstance
    .post<{ candidate: ExitCandidate }>(
      `/api/exit-candidates/${id}/dismiss`,
      note?.trim() ? { note: note.trim() } : {},
    )
    .then((res) => res.data.candidate)
