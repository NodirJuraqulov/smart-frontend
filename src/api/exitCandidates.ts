import { axiosInstance } from './axiosInstance'
import type {
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

export const confirmExitCandidate = (
  id: string,
  payload: ExitCandidateConfirmPayload,
) =>
  axiosInstance
    .post<ExitCandidateConfirmResponse>(`${candidatePath(id)}/confirm`, payload)
    .then((response) => response.data)

export const forceOpenExitCandidate = (
  id: string,
  payload: ExitCandidateForceOpenPayload,
) =>
  axiosInstance
    .post<ExitCandidateBarrierResponse>(
      `${candidatePath(id)}/force-open`,
      payload,
    )
    .then((response) => response.data)

export const retryExitCandidateBarrier = (id: string) =>
  axiosInstance
    .post<ExitCandidateBarrierResponse>(`${candidatePath(id)}/retry-barrier`)
    .then((response) => response.data)
