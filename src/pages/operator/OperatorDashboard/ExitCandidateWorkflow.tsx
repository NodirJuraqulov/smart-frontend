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
  requestModalOpen?: () => boolean
  releaseModal?: () => void
  onDataChanged: () => void
}

const allowModalOpen = () => true
const releaseModalOpen = () => undefined

export default function ExitCandidateWorkflow({
  newCandidateSignal,
  statusRefreshSignal,
  resolvedCandidateId,
  autoOpenBlocked = false,
  requestModalOpen = allowModalOpen,
  releaseModal = releaseModalOpen,
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

  const openCandidate = useCallback(
    (candidate: ExitCandidateNext, automatic = true) => {
      if ((automatic && autoOpenBlocked) || currentCandidateRef.current) {
        return false
      }
      if (!requestModalOpen()) return false
      setCandidate(candidate)
      return true
    }, [autoOpenBlocked, requestModalOpen, setCandidate],
  )

  const loadNext = useCallback(
    async (autoOpen: boolean) => {
      const result = await refetchNextCandidate()
      if (result.error) {
        message.error(
          getErrorMessage(result.error, t('exitCandidates.nextLoadError')),
        )
        return
      }
      if (autoOpen && result.data) openCandidate(result.data)
    },
    [message, openCandidate, refetchNextCandidate, t],
  )

  useEffect(() => {
    if (!isFetched || initialLoadHandledRef.current) return
    initialLoadHandledRef.current = true
    if (nextCandidate) openCandidate(nextCandidate)
  }, [isFetched, nextCandidate, openCandidate])

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
      releaseModal()
      void loadNext(true)
      return
    }
    void loadNext(false)
  }, [loadNext, releaseModal, resolvedCandidateId, setCandidate])

  const closeCurrent = () => {
    setCandidate(null)
    releaseModal()
  }

  const resolveAndAdvance = () => {
    setCandidate(null)
    releaseModal()
    void loadNext(true)
  }

  const pendingCount = nextCandidate?.pending_count_for_org ?? 0
  const buttonLabel = t('exitCandidates.reviewButton', {
    count: pendingCount,
  })
  const reviewCurrent = () => {
    if (!nextCandidate || pendingCount === 0) return
    openCandidate(nextCandidate, false)
  }

  return (
    <>
      <Button
        size="small"
        loading={isLoading}
        disabled={!nextCandidate || pendingCount === 0}
        aria-label={buttonLabel}
        onClick={reviewCurrent}
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
