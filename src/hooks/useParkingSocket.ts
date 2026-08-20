import { useEffect, useRef } from 'react'
import { acquireSocket, releaseSocket } from '@/services/socket'
import { useAppSelector } from './redux'
import type { DetectionType, ParkingSession, Payment } from '@/types/parking'
import type {
  ExitCompletedEvent,
  ExitCandidateCreatedEvent,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'
import {
  isExitCandidateCreatedEvent,
  isExitCandidateResolvedEvent,
  isExitCompletedEvent,
} from '@/types/exitCandidate'
import type {
  EntryCandidateCreatedEvent,
  EntryCandidateResolvedEvent,
} from '@/types/entryCandidate'
import {
  isEntryCandidateCreatedEvent,
  isEntryCandidateResolvedEvent,
} from '@/types/entryCandidate'

interface UseParkingSocketCallbacks {
  onEntry?: (session: ParkingSession, detected: boolean) => void
  onExit?: (
    session: ParkingSession,
    payment: Payment,
    detected: boolean,
  ) => void
  onDetectionFailed?: (type: DetectionType, imageUrl: string) => void
  onExitCompleted?: (payload: ExitCompletedEvent) => void
  onExitCandidateCreated?: (candidate: ExitCandidateCreatedEvent) => void
  onExitCandidateResolved?: (payload: ExitCandidateResolvedEvent) => void
  onEntryCandidateCreated?: (candidate: EntryCandidateCreatedEvent) => void
  onEntryCandidateResolved?: (payload: EntryCandidateResolvedEvent) => void
  onRelayFailed?: (direction: 'entry' | 'exit', message: string) => void
  onWebhookParseFailed?: (direction: 'entry' | 'exit', message: string) => void
}

export function useParkingSocket(callbacks: UseParkingSocketCallbacks) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const isAuthenticated = Boolean(accessToken)
  const role = useAppSelector((state) => state.auth.user?.role)

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!isAuthenticated || (role !== 'operator' && role !== 'owner')) return

    const socket = acquireSocket()

    const handleEntry = (payload: {
      session: ParkingSession
      detected: boolean
    }) => callbacksRef.current.onEntry?.(payload.session, payload.detected)

    const handleExit = (payload: {
      session: ParkingSession
      payment: Payment
      detected: boolean
    }) =>
      callbacksRef.current.onExit?.(
        payload.session,
        payload.payment,
        payload.detected,
      )

    const handleDetectionFailed = (payload: {
      type: DetectionType
      image_url: string
    }) => {
      callbacksRef.current.onDetectionFailed?.(payload.type, payload.image_url)
    }

    const handleExitCompleted = (payload: unknown) => {
      if (!isExitCompletedEvent(payload)) return
      callbacksRef.current.onExitCompleted?.(payload)
    }

    const handleExitCandidateCreated = (payload: unknown) => {
      if (!isExitCandidateCreatedEvent(payload)) return
      callbacksRef.current.onExitCandidateCreated?.(payload)
    }

    const handleExitCandidateResolved = (payload: unknown) => {
      if (!isExitCandidateResolvedEvent(payload)) return
      callbacksRef.current.onExitCandidateResolved?.(payload)
    }

    const handleEntryCandidateCreated = (payload: unknown) => {
      if (!isEntryCandidateCreatedEvent(payload)) return
      callbacksRef.current.onEntryCandidateCreated?.(payload)
    }

    const handleEntryCandidateResolved = (payload: unknown) => {
      if (!isEntryCandidateResolvedEvent(payload)) return
      callbacksRef.current.onEntryCandidateResolved?.(payload)
    }

    const handleRelayFailed = (payload: {
      direction: 'entry' | 'exit'
      message: string
    }) => {
      callbacksRef.current.onRelayFailed?.(payload.direction, payload.message)
    }

    const handleWebhookParseFailed = (payload: {
      direction: 'entry' | 'exit'
      message: string
    }) => {
      callbacksRef.current.onWebhookParseFailed?.(payload.direction, payload.message)
    }

    socket.on('parking:entry', handleEntry)
    socket.on('parking:exit', handleExit)
    socket.on('parking:detection_failed', handleDetectionFailed)
    socket.on('exit_completed', handleExitCompleted)
    socket.on('exit_candidate_created', handleExitCandidateCreated)
    socket.on('exit_candidate_resolved', handleExitCandidateResolved)
    socket.on('entry_candidate_created', handleEntryCandidateCreated)
    socket.on('entry_candidate_resolved', handleEntryCandidateResolved)
    socket.on('relay_failed', handleRelayFailed)
    socket.on('webhook_parse_failed', handleWebhookParseFailed)

    return () => {
      socket.off('parking:entry', handleEntry)
      socket.off('parking:exit', handleExit)
      socket.off('parking:detection_failed', handleDetectionFailed)
      socket.off('exit_completed', handleExitCompleted)
      socket.off('exit_candidate_created', handleExitCandidateCreated)
      socket.off('exit_candidate_resolved', handleExitCandidateResolved)
      socket.off('entry_candidate_created', handleEntryCandidateCreated)
      socket.off('entry_candidate_resolved', handleEntryCandidateResolved)
      socket.off('relay_failed', handleRelayFailed)
      socket.off('webhook_parse_failed', handleWebhookParseFailed)
      releaseSocket()
    }
  }, [isAuthenticated, role])
}
