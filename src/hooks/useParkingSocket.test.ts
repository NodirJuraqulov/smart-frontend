import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useParkingSocket } from './useParkingSocket'
import type {
  ExitCandidate,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'

const { connectSocketMock, disconnectSocketMock, onMock, offMock } = vi.hoisted(
  () => ({
    connectSocketMock: vi.fn(),
    disconnectSocketMock: vi.fn(),
    onMock: vi.fn(),
    offMock: vi.fn(),
  }),
)

vi.mock('@/services/socket', () => ({
  connectSocket: connectSocketMock,
  disconnectSocket: disconnectSocketMock,
}))

vi.mock('./redux', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        accessToken: 'access-token',
        user: { role: 'operator' },
      },
    }),
}))

const candidate: ExitCandidate = {
  id: 7,
  org_id: 2,
  webhook_event_id: 101,
  detected_plate: '01A777BA',
  matched_session_id: null,
  resolved_session_id: null,
  confidence: 94,
  camera_event_at: '2026-08-01T08:00:00.000Z',
  status: 'pending',
  resolution_type: null,
  resolved_by: null,
  resolved_at: null,
  resolution_note: null,
  created_at: '2026-08-01T08:00:01.000Z',
  updated_at: '2026-08-01T08:00:01.000Z',
  overviewImageUrl: null,
  vehicleImageUrl: null,
  plateImageUrl: null,
  matched_session: null,
}

describe('useParkingSocket exit candidate events', () => {
  beforeEach(() => {
    onMock.mockReset()
    offMock.mockReset()
    disconnectSocketMock.mockReset()
    connectSocketMock.mockReset().mockReturnValue({ on: onMock, off: offMock })
  })

  it('created va resolved eventlarini callbacklarga uzatadi va cleanup qiladi', () => {
    const onCreated = vi.fn()
    const onResolved = vi.fn()
    const { unmount } = renderHook(() =>
      useParkingSocket({
        onExitCandidateCreated: onCreated,
        onExitCandidateResolved: onResolved,
      }),
    )

    const createdHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_candidate_created',
    )?.[1] as (payload: ExitCandidate) => void
    const resolvedHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_candidate_resolved',
    )?.[1] as (payload: ExitCandidateResolvedEvent) => void
    const resolvedPayload: ExitCandidateResolvedEvent = {
      candidateId: 7,
      status: 'accepted',
      resolutionType: 'exact',
      sessionId: 44,
    }

    act(() => {
      createdHandler(candidate)
      resolvedHandler(resolvedPayload)
    })

    expect(onCreated).toHaveBeenCalledWith(candidate)
    expect(onResolved).toHaveBeenCalledWith(resolvedPayload)

    unmount()
    expect(offMock).toHaveBeenCalledWith(
      'exit_candidate_created',
      createdHandler,
    )
    expect(offMock).toHaveBeenCalledWith(
      'exit_candidate_resolved',
      resolvedHandler,
    )
    expect(disconnectSocketMock).toHaveBeenCalled()
  })
})
