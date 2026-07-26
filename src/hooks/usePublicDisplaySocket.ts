import { useEffect, useRef, useState } from 'react'
import { connectPublicDisplaySocket } from '@/services/publicDisplaySocket'

interface UsePublicDisplaySocketCallbacks {
  onEntryDetected?: (plateNumber: string, enteredAt: string) => void
  onParkingFull?: (plateNumber: string) => void
  onExitAwaitingPayment?: (
    plateNumber: string,
    amount: number,
    enteredAt: string,
    durationMinutes: number,
  ) => void
  onExitCompleted?: (plateNumber: string, amount: number) => void
  onPlateNotRecognized?: (plateNumber: string, message: string) => void
  onRelayFailed?: (
    direction: 'entry' | 'exit',
    plateNumber: string,
    message: string,
  ) => void
}

export function usePublicDisplaySocket(
  orgId: number,
  callbacks: UsePublicDisplaySocketCallbacks,
): boolean {
  const [isConnected, setIsConnected] = useState(false)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!orgId) return

    const socket = connectPublicDisplaySocket(orgId)

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    const handleEntryDetected = (payload: {
      plateNumber: string
      enteredAt: string
    }) =>
      callbacksRef.current.onEntryDetected?.(payload.plateNumber, payload.enteredAt)

    const handleParkingFull = (payload: { plateNumber: string }) =>
      callbacksRef.current.onParkingFull?.(payload.plateNumber)

    const handleExitAwaitingPayment = (payload: {
      plateNumber: string
      amount: number
      enteredAt: string
      durationMinutes: number
    }) =>
      callbacksRef.current.onExitAwaitingPayment?.(
        payload.plateNumber,
        payload.amount,
        payload.enteredAt,
        payload.durationMinutes,
      )

    const handleExitCompleted = (payload: {
      plateNumber: string
      amount: number
    }) =>
      callbacksRef.current.onExitCompleted?.(payload.plateNumber, payload.amount)

    const handlePlateNotRecognized = (payload: {
      plateNumber: string
      message: string
    }) =>
      callbacksRef.current.onPlateNotRecognized?.(
        payload.plateNumber,
        payload.message,
      )

    const handleRelayFailed = (payload: {
      direction: 'entry' | 'exit'
      plateNumber: string
      message: string
    }) =>
      callbacksRef.current.onRelayFailed?.(
        payload.direction,
        payload.plateNumber,
        payload.message,
      )

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('entry_detected', handleEntryDetected)
    socket.on('parking_full', handleParkingFull)
    socket.on('exit_awaiting_payment', handleExitAwaitingPayment)
    socket.on('exit_completed', handleExitCompleted)
    socket.on('plate_not_recognized_for_exit', handlePlateNotRecognized)
    socket.on('relay_failed', handleRelayFailed)

    return () => {
      socket.disconnect()
    }
  }, [orgId])

  return isConnected
}
