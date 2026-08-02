import { useEffect, useRef, useState } from 'react'
import { connectPublicDisplaySocket } from '@/services/publicDisplaySocket'
import type {
  EntryDisplayFlowStatus,
  ExitDisplayFlowStatus,
} from '@/types/publicDisplay'
import {
  isEntryDisplayFlowStatus,
  isExitDisplayFlowStatus,
} from '@/types/publicDisplay'

interface UsePublicDisplaySocketCallbacks {
  onEntryStatusChanged?: (status: EntryDisplayFlowStatus) => void
  onExitStatusChanged?: (status: ExitDisplayFlowStatus) => void
}

export function usePublicDisplaySocket(
  orgId: number,
  callbacks: UsePublicDisplaySocketCallbacks,
): boolean {
  const [isConnected, setIsConnected] = useState(false)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    if (!Number.isInteger(orgId) || orgId < 1) return

    const socket = connectPublicDisplaySocket(orgId)

    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    const handleEntryStatusChanged = (payload: unknown) => {
      if (!isEntryDisplayFlowStatus(payload)) return
      callbacksRef.current.onEntryStatusChanged?.(payload)
    }

    const handleExitStatusChanged = (payload: unknown) => {
      if (!isExitDisplayFlowStatus(payload)) return
      callbacksRef.current.onExitStatusChanged?.(payload)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('public:entry-status-changed', handleEntryStatusChanged)
    socket.on('public:exit-status-changed', handleExitStatusChanged)

    return () => {
      socket.disconnect()
    }
  }, [orgId])

  return isConnected
}
