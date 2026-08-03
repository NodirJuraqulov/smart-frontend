import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button } from 'antd'
import { getNextEntryCandidate } from '@/api/entryCandidates'
import { getErrorMessage } from '@/utils/apiError'
import type { EntryCandidateNext } from '@/types/entryCandidate'
import EntryCandidateModal from './EntryCandidateModal'
import { ENTRY_CANDIDATE_NEXT_QUERY_KEY } from './entryCandidateQueryKeys'

interface Props {
  newCandidateSignal: number
  statusRefreshSignal: number
  resolvedCandidateId: number | null
  autoOpenBlocked?: boolean
  requestModalOpen?: () => boolean
  releaseModal?: () => void
  onDataChanged: () => void
}

const allowModalOpen = () => true
const releaseModalOpen = () => undefined

export default function EntryCandidateWorkflow({
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
    useState<EntryCandidateNext | null>(null)
  const currentCandidateRef = useRef<EntryCandidateNext | null>(null)
  const initialLoadHandledRef = useRef(false)
  const newCandidateSignalRef = useRef(newCandidateSignal)
  const statusRefreshSignalRef = useRef(statusRefreshSignal)
  const resolvedCandidateIdRef = useRef<number | null>(resolvedCandidateId)

  const {
    data: nextCandidate,
    isFetched,
    isLoading,
    refetch: refetchNextCandidate,
  } = useQuery({
    queryKey: ENTRY_CANDIDATE_NEXT_QUERY_KEY,
    queryFn: getNextEntryCandidate,
    refetchInterval: 30000,
    retry: false,
  })

  const setCandidate = useCallback((candidate: EntryCandidateNext | null) => {
    currentCandidateRef.current = candidate
    setCurrentCandidate(candidate)
  }, [])

  const openCandidate = useCallback(
    (candidate: EntryCandidateNext, automatic = true) => {
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
          getErrorMessage(result.error, t('entryCandidates.nextLoadError')),
        )
        return
      }
      if (autoOpen && result.data) openCandidate(result.data)
    }, [message, openCandidate, refetchNextCandidate, t],
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
    if (currentCandidateRef.current?.candidate_id === resolvedCandidateId) {
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
  const buttonLabel = t('entryCandidates.reviewButton', {
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
        <EntryCandidateModal
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
