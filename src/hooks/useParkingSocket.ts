import { useEffect, useRef } from 'react'
import { connectSocket, disconnectSocket } from '@/services/socket'
import { useAppSelector } from './redux'
import type { DetectionType, ParkingSession, Payment } from '@/types/parking'

interface UseParkingSocketCallbacks {
  onEntry?: (session: ParkingSession, detected: boolean) => void
  onExit?: (
    session: ParkingSession,
    payment: Payment,
    detected: boolean,
  ) => void
  onDetectionFailed?: (type: DetectionType, imageUrl: string) => void
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

    socket.on('parking:entry', handleEntry)
    socket.on('parking:exit', handleExit)
    socket.on('parking:detection_failed', handleDetectionFailed)

    return () => {
      socket.off('parking:entry', handleEntry)
      socket.off('parking:exit', handleExit)
      socket.off('parking:detection_failed', handleDetectionFailed)
      disconnectSocket()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [role])
}
