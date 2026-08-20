import { io, type Socket } from 'socket.io-client'
import type { DetectionType, ParkingSession, Payment } from '@/types/parking'
import type {
  ExitCompletedEvent,
  ExitCandidateCreatedEvent,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'
import type {
  EntryCandidateCreatedEvent,
  EntryCandidateResolvedEvent,
} from '@/types/entryCandidate'
import type { BlacklistAttemptEvent } from '@/types/blacklist'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import { refreshAccessToken } from './authSession'

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
  entry_candidate_created: (payload: EntryCandidateCreatedEvent) => void
  entry_candidate_resolved: (payload: EntryCandidateResolvedEvent) => void
  blacklist_attempt: (payload: BlacklistAttemptEvent) => void
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
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempt = 0
let authRecoveryPending = false
let socketConsumers = 0

const RECONNECT_DELAYS = [2000, 3000, 5000]
const SOCKET_AUTH_ERRORS = new Set([
  'Token topilmadi',
  'Token yaroqsiz yoki muddati tugagan',
])

function clearReconnectTimer() {
  if (!reconnectTimer) return
  clearTimeout(reconnectTimer)
  reconnectTimer = null
}

function scheduleReconnect(target: ParkingSocket) {
  clearReconnectTimer()
  const delay =
    RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)]
  reconnectAttempt += 1
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    if (socket === target) {
      target.connect()
    }
  }, delay)
}

function isSocketAuthError(error: Error & { data?: { status?: number } }) {
  return error.data?.status === 401 || SOCKET_AUTH_ERRORS.has(error.message)
}

export function connectSocket(): ParkingSocket {
  if (socket) return socket

  socket = io(API_BASE_URL, {
    auth: (cb) => cb({ token: localStorage.getItem('accessToken') }),
    reconnection: true,
    reconnectionDelay: RECONNECT_DELAYS[0],
    reconnectionDelayMax: RECONNECT_DELAYS[RECONNECT_DELAYS.length - 1],
    randomizationFactor: 0,
  })

  socket.on('connect', () => {
    clearReconnectTimer()
    reconnectAttempt = 0
    authRecoveryPending = false
    console.log('[socket] connected', socket?.id)
  })
  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason)
    if (reason === 'io server disconnect' && socket) {
      scheduleReconnect(socket)
    }
  })
  socket.on('connect_error', (error) => {
    console.error('[socket] connection error:', error.message)
    if (!isSocketAuthError(error) || authRecoveryPending || !socket) return

    const target = socket
    authRecoveryPending = true
    void refreshAccessToken()
      .then(() => {
        if (socket === target) {
          scheduleReconnect(target)
        }
      })
      .catch(() => undefined)
      .finally(() => {
        authRecoveryPending = false
      })
  })

  return socket
}

export function acquireSocket(): ParkingSocket {
  socketConsumers += 1
  return connectSocket()
}

export function releaseSocket(): void {
  if (socketConsumers > 0) socketConsumers -= 1
  if (socketConsumers === 0) disconnectSocket()
}

export function disconnectSocket(): void {
  clearReconnectTimer()
  reconnectAttempt = 0
  authRecoveryPending = false
  socketConsumers = 0
  socket?.disconnect()
  socket = null
}

export function getSocket(): ParkingSocket | null {
  return socket
}
