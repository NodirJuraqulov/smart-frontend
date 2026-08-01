import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button } from 'antd'
import { getNextExitCandidate } from '@/api/exitCandidates'
import { getErrorMessage } from '@/utils/apiError'
import type { ExitCandidateNext } from '@/types/exitCandidate'
import ExitCandidateModal from './ExitCandidateModal'
import { EXIT_CANDIDATE_NEXT_QUERY_KEY } from './exitCandidateQueryKeys'

interface Props {
  newCandidateSignal: number
  statusRefreshSignal: number
  resolvedCandidateId: string | null
  autoOpenBlocked?: boolean
  onDataChanged: () => void
}

export default function ExitCandidateWorkflow({
  newCandidateSignal,
  statusRefreshSignal,
  resolvedCandidateId,
  autoOpenBlocked = false,
  onDataChanged,
}: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const [currentCandidate, setCurrentCandidate] =
    useState<ExitCandidateNext | null>(null)
  const currentCandidateRef = useRef<ExitCandidateNext | null>(null)
  const initialLoadHandledRef = useRef(false)
  const newCandidateSignalRef = useRef(newCandidateSignal)
  const statusRefreshSignalRef = useRef(statusRefreshSignal)
  const resolvedCandidateIdRef = useRef<string | null>(resolvedCandidateId)

  const {
    data: nextCandidate,
    isFetched,
    isLoading,
    refetch: refetchNextCandidate,
  } = useQuery({
    queryKey: EXIT_CANDIDATE_NEXT_QUERY_KEY,
    queryFn: getNextExitCandidate,
    refetchInterval: 30000,
    retry: false,
  })

  const setCandidate = useCallback((candidate: ExitCandidateNext | null) => {
    currentCandidateRef.current = candidate
    setCurrentCandidate(candidate)
  }, [])

  const loadNext = useCallback(
    async (autoOpen: boolean) => {
      const result = await refetchNextCandidate()
      if (result.error) {
        message.error(
          getErrorMessage(result.error, t('exitCandidates.nextLoadError')),
        )
        return
      }
      if (
        autoOpen &&
        !autoOpenBlocked &&
        !currentCandidateRef.current &&
        result.data
      ) {
        setCandidate(result.data)
      }
    },
    [autoOpenBlocked, message, refetchNextCandidate, setCandidate, t],
  )

  useEffect(() => {
    if (!isFetched || initialLoadHandledRef.current) return
    initialLoadHandledRef.current = true
    if (nextCandidate && !autoOpenBlocked) setCandidate(nextCandidate)
  }, [autoOpenBlocked, isFetched, nextCandidate, setCandidate])

  useEffect(() => {
    if (newCandidateSignalRef.current === newCandidateSignal) return
    newCandidateSignalRef.current = newCandidateSignal
    void loadNext(true)
  }, [loadNext, newCandidateSignal])

  useEffect(() => {
    if (statusRefreshSignalRef.current === statusRefreshSignal) return
    statusRefreshSignalRef.current = statusRefreshSignal
    void loadNext(false)
  }, [loadNext, statusRefreshSignal])

  useEffect(() => {
    if (
      !resolvedCandidateId ||
      resolvedCandidateIdRef.current === resolvedCandidateId
    ) {
      return
    }
    resolvedCandidateIdRef.current = resolvedCandidateId
    if (
      currentCandidateRef.current?.candidate_id === resolvedCandidateId
    ) {
      setCandidate(null)
      void loadNext(true)
      return
    }
    void loadNext(false)
  }, [loadNext, resolvedCandidateId, setCandidate])

  const closeCurrent = () => setCandidate(null)

  const resolveAndAdvance = () => {
    setCandidate(null)
    void loadNext(true)
  }

  const pendingCount = nextCandidate?.pending_count_for_org ?? 0
  const buttonLabel = t('exitCandidates.reviewButton', {
    count: pendingCount,
  })

  return (
    <>
      <Button
        size="small"
        loading={isLoading}
        aria-label={buttonLabel}
        onClick={() => void loadNext(true)}
      >
        {buttonLabel}
      </Button>
      {currentCandidate && (
        <ExitCandidateModal
          candidate={currentCandidate}
          onClose={closeCurrent}
          onResolved={resolveAndAdvance}
          onPendingRefresh={() => void loadNext(false)}
          onDataChanged={onDataChanged}
        />
      )}
    </>
  )
}
