import { useEffect, useRef } from 'react'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { useAppSelector } from './redux'
import type { DetectionType, ParkingSession, Payment } from '@/types/parking'
import type {
  ExitCandidate,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'

interface UseParkingSocketCallbacks {
  onEntry?: (session: ParkingSession, detected: boolean) => void
  onExit?: (
    session: ParkingSession,
    payment: Payment,
    detected: boolean,
  ) => void
  onDetectionFailed?: (type: DetectionType, imageUrl: string) => void
  onAwaitingPayment?: (plateNumber: string, amount: number) => void
  onExitCompleted?: (plateNumber: string, amount: number) => void
  onExitCandidateCreated?: (candidate: ExitCandidate) => void
  onExitCandidateResolved?: (payload: ExitCandidateResolvedEvent) => void
  onRelayFailed?: (direction: 'entry' | 'exit', message: string) => void
  onWebhookParseFailed?: (direction: 'entry' | 'exit', message: string) => void
}

export function useParkingSocket(callbacks: UseParkingSocketCallbacks) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const role = useAppSelector((state) => state.auth.user?.role)

  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!accessToken || (role !== 'operator' && role !== 'owner')) return

    const socket = connectSocket()

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

    const handleAwaitingPayment = (payload: {
      plateNumber: string
      amount: number
    }) => {
      callbacksRef.current.onAwaitingPayment?.(payload.plateNumber, payload.amount)
    }

    const handleExitCompleted = (payload: {
      plateNumber: string
      amount: number
    }) => {
      callbacksRef.current.onExitCompleted?.(payload.plateNumber, payload.amount)
    }

    const handleExitCandidateCreated = (candidate: ExitCandidate) => {
      callbacksRef.current.onExitCandidateCreated?.(candidate)
    }

    const handleExitCandidateResolved = (
      payload: ExitCandidateResolvedEvent,
    ) => {
      callbacksRef.current.onExitCandidateResolved?.(payload)
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
    socket.on('exit_awaiting_payment', handleAwaitingPayment)
    socket.on('exit_completed', handleExitCompleted)
    socket.on('exit_candidate_created', handleExitCandidateCreated)
    socket.on('exit_candidate_resolved', handleExitCandidateResolved)
    socket.on('relay_failed', handleRelayFailed)
    socket.on('webhook_parse_failed', handleWebhookParseFailed)

    return () => {
      socket.off('parking:entry', handleEntry)
      socket.off('parking:exit', handleExit)
      socket.off('parking:detection_failed', handleDetectionFailed)
      socket.off('exit_awaiting_payment', handleAwaitingPayment)
      socket.off('exit_completed', handleExitCompleted)
      socket.off('exit_candidate_created', handleExitCandidateCreated)
      socket.off('exit_candidate_resolved', handleExitCandidateResolved)
      socket.off('relay_failed', handleRelayFailed)
      socket.off('webhook_parse_failed', handleWebhookParseFailed)
      disconnectSocket()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [role])
}
