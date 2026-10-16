import { axiosInstance } from './axiosInstance'
import type {
  CancelledExitHistoryParams,
  CancelledExitHistoryResponse,
  ExitCandidateBarrierResponse,
  ExitCandidateConfirmPayload,
  ExitCandidateConfirmResponse,
  ExitCandidateForceOpenPayload,
  ExitCandidateNext,
  ExitCandidateSearchResponse,
} from '@/types/exitCandidate'

const candidatePath = (id: string) =>
  `/api/exit-candidates/${encodeURIComponent(id)}`

export async function getNextExitCandidate(): Promise<ExitCandidateNext | null> {
  const response = await axiosInstance.get<ExitCandidateNext>(
    '/api/exit-candidates/next',
  )
  return response.status === 204 ? null : response.data
}

export const searchExitCandidate = (id: string, plate?: string) => {
  const path = `${candidatePath(id)}/search`
  const normalizedPlate = plate?.trim()
  const request = normalizedPlate
    ? axiosInstance.post<ExitCandidateSearchResponse>(path, {
        plate: normalizedPlate,
      })
    : axiosInstance.post<ExitCandidateSearchResponse>(path)
  return request.then((response) => response.data)
}

export const previewExitSession = ({
  candidateId,
  sessionId,
}: {
  candidateId: string
  sessionId: string
}) =>
  axiosInstance
    .post(`${candidatePath(candidateId)}/preview-session`, {
      sessionId: Number(sessionId),
    })
    .then((response) => response.data)

export const confirmExitCandidate = (
  id: string,
  payload: ExitCandidateConfirmPayload,
) =>
  axiosInstance
    .post<ExitCandidateConfirmResponse>(`${candidatePath(id)}/confirm`, payload)
    .then((response) => response.data)

export const forceOpenExitCandidate = (
  id: string,
  payload?: ExitCandidateForceOpenPayload,
) => {
  const path = `${candidatePath(id)}/force-open`
  const request = payload
    ? axiosInstance.post<ExitCandidateBarrierResponse>(path, {
        is_emergency: payload.isEmergency,
      })
    : axiosInstance.post<ExitCandidateBarrierResponse>(path)
  return request.then((response) => response.data)
}

export const cancelExitCandidate = (id: string) =>
  axiosInstance
    .post(`${candidatePath(id)}/cancel-exit`)
    .then((response) => response.data)

export const getCancelledExitCandidates = (
  params: CancelledExitHistoryParams,
) =>
  axiosInstance
    .get<CancelledExitHistoryResponse>('/api/exit-candidates/cancelled', {
      params,
    })
    .then((response) => response.data)

export const retryExitCandidateBarrier = (id: string) =>
  axiosInstance
    .post<ExitCandidateBarrierResponse>(`${candidatePath(id)}/retry-barrier`)
    .then((response) => response.data)
