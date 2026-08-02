import { axiosInstance } from './axiosInstance'
import type { ExitCandidateBarrierResponse } from '@/types/exitCandidate'
import type {
  EntryCandidateAcceptPayload,
  EntryCandidateAcceptResponse,
  EntryCandidateDeclineResponse,
  EntryCandidateNext,
  ManualParkingEntryPayload,
  ManualParkingEntryResponse,
} from '@/types/entryCandidate'

const candidatePath = (id: number) =>
  `/api/entry-candidates/${encodeURIComponent(id)}`

export async function getNextEntryCandidate(): Promise<EntryCandidateNext | null> {
  const response = await axiosInstance.get<EntryCandidateNext>(
    '/api/entry-candidates/next',
  )
  return response.status === 204 ? null : response.data
}

export const acceptEntryCandidate = (
  id: number,
  payload: EntryCandidateAcceptPayload,
) =>
  axiosInstance
    .post<EntryCandidateAcceptResponse>(`${candidatePath(id)}/accept`, payload)
    .then((response) => response.data)

export const declineEntryCandidate = (id: number, note?: string) =>
  axiosInstance
    .post<EntryCandidateDeclineResponse>(`${candidatePath(id)}/decline`, {
      ...(note?.trim() ? { note: note.trim() } : {}),
    })
    .then((response) => response.data)

export const createManualParkingEntry = (payload: ManualParkingEntryPayload) =>
  axiosInstance
    .post<ManualParkingEntryResponse>(
      '/api/parking-sessions/manual-entry',
      payload,
    )
    .then((response) => response.data)

export const retryEntryBarrier = (sessionId: number) =>
  axiosInstance
    .post<ExitCandidateBarrierResponse>(
      `/api/parking-sessions/${encodeURIComponent(sessionId)}/retry-entry-barrier`,
    )
    .then((response) => response.data)
