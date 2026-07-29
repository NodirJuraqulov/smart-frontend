import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'

interface PublicDisplayServerToClientEvents {
  entry_detected: (payload: { plateNumber: string; enteredAt: string }) => void
  parking_full: (payload: { plateNumber: string }) => void
  exit_awaiting_payment: (payload: {
    plateNumber: string
    amount: number
    enteredAt: string
    durationMinutes: number
  }) => void
  exit_completed: (payload: { plateNumber: string; amount: number }) => void
  plate_not_recognized_for_exit: (payload: {
    plateNumber: string
    message: string
  }) => void
  relay_failed: (payload: {
    direction: 'entry' | 'exit'
    plateNumber: string
    message: string
  }) => void
}

type PublicDisplayClientToServerEvents = Record<string, never>

export type PublicDisplaySocket = Socket<
  PublicDisplayServerToClientEvents,
  PublicDisplayClientToServerEvents
>

export function connectPublicDisplaySocket(orgId: number): PublicDisplaySocket {
  return io(API_BASE_URL, {
    auth: { orgId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  })
}
