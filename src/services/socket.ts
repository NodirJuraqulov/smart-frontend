import { io, type Socket } from 'socket.io-client'
import type { DetectionType, ParkingSession, Payment } from '@/types/parking'
import type {
  ExitCompletedEvent,
  ExitCandidateCreatedEvent,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'

interface ServerToClientEvents {
  'parking:entry': (payload: {
    session: ParkingSession
    detected: boolean
  }) => void
  'parking:exit': (payload: {
    session: ParkingSession
    payment: Payment
    detected: boolean
  }) => void
  'parking:detection_failed': (payload: {
    type: DetectionType
    image_url: string
  }) => void
  exit_completed: (payload: ExitCompletedEvent) => void
  exit_candidate_created: (payload: ExitCandidateCreatedEvent) => void
  exit_candidate_resolved: (payload: ExitCandidateResolvedEvent) => void
  relay_failed: (payload: {
    direction: 'entry' | 'exit'
    plateNumber: string
    message: string
  }) => void
  webhook_parse_failed: (payload: {
    direction: 'entry' | 'exit'
    message: string
  }) => void
}

type ClientToServerEvents = Record<string, never>

export type ParkingSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: ParkingSocket | null = null

export function connectSocket(): ParkingSocket {
  if (socket) return socket

  socket = io(API_BASE_URL, {
    auth: (cb) => cb({ token: localStorage.getItem('accessToken') }),
  })

  socket.on('connect', () => {
    console.log('[socket] connected', socket?.id)
  })
  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason)
    if (reason === 'io server disconnect') {
      socket?.connect()
    }
  })
  socket.on('connect_error', (error) => {
    console.error('[socket] connection error:', error.message)
  })

  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

export function getSocket(): ParkingSocket | null {
  return socket
}
