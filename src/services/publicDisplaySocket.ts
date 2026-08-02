import { io, type Socket } from 'socket.io-client'
import { API_BASE_URL } from '@/utils/runtimeBaseUrl'
import type {
  EntryDisplayFlowStatus,
  ExitDisplayFlowStatus,
} from '@/types/publicDisplay'

interface PublicDisplayServerToClientEvents {
  'public:entry-status-changed': (payload: EntryDisplayFlowStatus) => void
  'public:exit-status-changed': (payload: ExitDisplayFlowStatus) => void
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
