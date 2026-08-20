import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useParkingSocket } from './useParkingSocket'
import type {
  ExitCompletedEvent,
  ExitCandidateCreatedEvent,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'
import type {
  EntryCandidateCreatedEvent,
  EntryCandidateResolvedEvent,
} from '@/types/entryCandidate'

const { acquireSocketMock, releaseSocketMock, onMock, offMock } = vi.hoisted(
  () => ({
    acquireSocketMock: vi.fn(),
    releaseSocketMock: vi.fn(),
    onMock: vi.fn(),
    offMock: vi.fn(),
  }),
)

vi.mock('@/services/socket', () => ({
  acquireSocket: acquireSocketMock,
  releaseSocket: releaseSocketMock,
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

const candidate: ExitCandidateCreatedEvent = {
  candidateId: 7,
  orgId: 3,
  webhookEventId: 91,
  detectedPlate: '01A777BA',
  matchedSessionId: 44,
  confidence: 98.2,
  cameraEventAt: '2026-08-01T08:00:00.000Z',
  status: 'pending',
  exitImages: {
    overviewUrl: '/api/exit-overview',
    vehicleUrl: '/api/exit-vehicle',
    plateUrl: '/api/exit-plate',
  },
}

describe('useParkingSocket exit candidate events', () => {
  beforeEach(() => {
    onMock.mockReset()
    offMock.mockReset()
    releaseSocketMock.mockReset()
    acquireSocketMock.mockReset().mockReturnValue({ on: onMock, off: offMock })
  })

  it('created va resolved eventlarini callbacklarga uzatadi va cleanup qiladi', () => {
    const onCreated = vi.fn()
    const onResolved = vi.fn()
    const onCompleted = vi.fn()
    const { unmount } = renderHook(() =>
      useParkingSocket({
        onExitCandidateCreated: onCreated,
        onExitCandidateResolved: onResolved,
        onExitCompleted: onCompleted,
      }),
    )

    const createdHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_candidate_created',
    )?.[1] as (payload: unknown) => void
    const resolvedHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_candidate_resolved',
    )?.[1] as (payload: unknown) => void
    const completedHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_completed',
    )?.[1] as (payload: unknown) => void
    const resolvedPayload: ExitCandidateResolvedEvent = {
      candidateId: 7,
      orgId: 3,
      status: 'accepted',
      resolutionType: 'exact',
      sessionId: 44,
      barrierStatus: 'opened',
    }
    const completedPayload: ExitCompletedEvent = {
      orgId: 3,
      sessionId: 44,
      plateNumber: '01A777BA',
      amount: 12000,
      paymentMethod: 'cash',
      barrierStatus: 'opened',
    }

    act(() => {
      createdHandler(candidate)
      resolvedHandler(resolvedPayload)
      completedHandler(completedPayload)
    })

    expect(onCreated).toHaveBeenCalledWith(candidate)
    expect(onResolved).toHaveBeenCalledWith(resolvedPayload)
    expect(onCompleted).toHaveBeenCalledWith(completedPayload)

    unmount()
    expect(offMock).toHaveBeenCalledWith(
      'exit_candidate_created',
      createdHandler,
    )
    expect(offMock).toHaveBeenCalledWith(
      'exit_candidate_resolved',
      resolvedHandler,
    )
    expect(onMock).not.toHaveBeenCalledWith(
      'exit_awaiting_payment',
      expect.any(Function),
    )
    expect(releaseSocketMock).toHaveBeenCalled()
  })

  it('entry candidate created va resolved eventlarini uzatadi', () => {
    const onCreated = vi.fn()
    const onResolved = vi.fn()
    const { unmount } = renderHook(() =>
      useParkingSocket({
        onEntryCandidateCreated: onCreated,
        onEntryCandidateResolved: onResolved,
      }),
    )
    const createdHandler = onMock.mock.calls.find(
      ([event]) => event === 'entry_candidate_created',
    )?.[1] as (payload: unknown) => void
    const resolvedHandler = onMock.mock.calls.find(
      ([event]) => event === 'entry_candidate_resolved',
    )?.[1] as (payload: unknown) => void
    const createdPayload: EntryCandidateCreatedEvent = {
      candidateId: 17,
      orgId: 3,
      detectedPlate: null,
      cameraEventAt: '2026-08-02T08:00:00.000Z',
      confidence: null,
      entryImages: {
        overviewUrl: null,
        vehicleUrl: '/api/entry-vehicle',
        imageAvailable: true,
      },
    }
    const resolvedPayload: EntryCandidateResolvedEvent = {
      candidateId: 17,
      orgId: 3,
      status: 'accepted',
      sessionId: 51,
      barrierStatus: 'opened',
    }

    act(() => {
      createdHandler(createdPayload)
      resolvedHandler(resolvedPayload)
    })

    expect(onCreated).toHaveBeenCalledWith(createdPayload)
    expect(onResolved).toHaveBeenCalledWith(resolvedPayload)

    unmount()
    expect(offMock).toHaveBeenCalledWith(
      'entry_candidate_created',
      createdHandler,
    )
    expect(offMock).toHaveBeenCalledWith(
      'entry_candidate_resolved',
      resolvedHandler,
    )
  })

  it('snake_case WebSocket payloadlarini callbacklarga uzatmaydi', () => {
    const onCreated = vi.fn()
    const onResolved = vi.fn()
    const onCompleted = vi.fn()
    renderHook(() =>
      useParkingSocket({
        onExitCandidateCreated: onCreated,
        onExitCandidateResolved: onResolved,
        onExitCompleted: onCompleted,
      }),
    )
    const createdHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_candidate_created',
    )?.[1] as (payload: unknown) => void
    const resolvedHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_candidate_resolved',
    )?.[1] as (payload: unknown) => void
    const completedHandler = onMock.mock.calls.find(
      ([event]) => event === 'exit_completed',
    )?.[1] as (payload: unknown) => void

    act(() => {
      createdHandler({ candidate_id: 7, status: 'pending' })
      resolvedHandler({ candidate_id: 7, status: 'accepted' })
      completedHandler({ session_id: 44, barrier_status: 'opened' })
    })

    expect(onCreated).not.toHaveBeenCalled()
    expect(onResolved).not.toHaveBeenCalled()
    expect(onCompleted).not.toHaveBeenCalled()
  })
})
