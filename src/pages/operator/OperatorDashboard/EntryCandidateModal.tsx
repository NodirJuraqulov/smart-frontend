import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Input,
  Modal,
  Space,
  Typography,
  type InputRef,
} from 'antd'
import {
  acceptEntryCandidate,
  declineEntryCandidate,
  retryEntryBarrier,
} from '@/api/entryCandidates'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import type { ExitCandidateBarrierStatus } from '@/types/exitCandidate'
import type {
  EntryCandidateNext,
  EntryCandidateReason,
} from '@/types/entryCandidate'

interface Props {
  candidate: EntryCandidateNext
  onClose: () => void
  onResolved: () => void
  onPendingRefresh: () => void
  onDataChanged: () => void
}

const titleKey: Record<EntryCandidateReason, string> = {
  capacity_full: 'entryCandidates.titleCapacityFull',
  plate_not_detected: 'entryCandidates.titlePlateNotDetected',
  capacity_full_and_plate_not_detected:
    'entryCandidates.titleCapacityAndPlate',
}

function entryImageUrl(candidate: EntryCandidateNext) {
  if (!candidate.entry_images.image_available) return null
  return (
    candidate.entry_images.overview_url ?? candidate.entry_images.vehicle_url
  )
}

function isActivePlateConflict(error: unknown) {
  if (!isAxiosError(error) || error.response?.status !== 409) return false
  const data = error.response.data
  if (
    typeof data === 'object' &&
    data !== null &&
    'existing_session' in data
  ) {
    return true
  }
  const text =
    typeof data === 'object' && data !== null
      ? String(
          (data as { message?: unknown; error?: unknown }).message ??
            (data as { error?: unknown }).error ??
            '',
        )
      : ''
  return /active|faol|ichida|band|stoyankada|parking/i.test(text)
}

export default function EntryCandidateModal({
  candidate,
  onClose,
  onResolved,
  onPendingRefresh,
  onDataChanged,
}: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const inputRef = useRef<InputRef>(null)
  const submittingRef = useRef(false)
  const [plate, setPlate] = useState(candidate.detected_plate ?? '')
  const [declineConfirmOpen, setDeclineConfirmOpen] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [barrierStatus, setBarrierStatus] =
    useState<Exclude<ExitCandidateBarrierStatus, 'opened'> | null>(null)
  const [retryUnavailable, setRetryUnavailable] = useState(false)

  useEffect(() => {
    setPlate(candidate.detected_plate ?? '')
    setDeclineConfirmOpen(false)
    setSessionId(null)
    setBarrierStatus(null)
    setRetryUnavailable(false)
    submittingRef.current = false
  }, [candidate])

  const handleBarrierStatus = (
    status: ExitCandidateBarrierStatus,
    resolvedSessionId: number,
  ) => {
    if (status === 'opened') return false
    setSessionId(resolvedSessionId)
    setBarrierStatus(status)
    setRetryUnavailable(status !== 'failed')
    onPendingRefresh()
    message.error(
      t(
        status === 'failed'
          ? 'entryCandidates.entrySavedBarrierFailed'
          : 'entryCandidates.entrySavedBarrierUnavailable',
      ),
    )
    return true
  }

  const handleConflict = (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 409) return false
    if (isActivePlateConflict(error)) {
      message.error(t('entryCandidates.plateAlreadyActive'))
      window.setTimeout(() => inputRef.current?.focus())
      return true
    }
    message.warning(t('entryCandidates.alreadyResolved'))
    onResolved()
    return true
  }

  const acceptMutation = useMutation({
    mutationFn: () =>
      acceptEntryCandidate(candidate.candidate_id, {
        plate_number: plate.trim(),
      }),
    onSuccess: (data) => {
      onDataChanged()
      if (handleBarrierStatus(data.barrier_status, data.session_id)) return
      message.success(t('entryCandidates.acceptSuccess'))
      onResolved()
    },
    onError: (error) => {
      if (handleConflict(error)) return
      message.error(getErrorMessage(error, t('entryCandidates.acceptError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const declineMutation = useMutation({
    mutationFn: () => declineEntryCandidate(candidate.candidate_id),
    onSuccess: () => {
      message.success(t('entryCandidates.declineSuccess'))
      onResolved()
    },
    onError: (error) => {
      if (handleConflict(error)) return
      message.error(getErrorMessage(error, t('entryCandidates.declineError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const retryMutation = useMutation({
    mutationFn: () => retryEntryBarrier(sessionId!),
    onSuccess: (data) => {
      if (handleBarrierStatus(data.barrier_status, sessionId!)) return
      message.success(t('entryCandidates.retrySuccess'))
      onResolved()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 400) {
        setRetryUnavailable(true)
      }
      message.error(getErrorMessage(error, t('entryCandidates.retryError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const isPending =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    retryMutation.isPending
  const canAccept = Boolean(plate.trim()) && !isPending && !barrierStatus

  const submitAccept = () => {
    if (!canAccept || submittingRef.current) return
    submittingRef.current = true
    acceptMutation.mutate()
  }

  const submitDecline = () => {
    if (submittingRef.current || isPending) return
    submittingRef.current = true
    declineMutation.mutate()
  }

  const submitRetry = () => {
    if (
      barrierStatus !== 'failed' ||
      !sessionId ||
      retryUnavailable ||
      submittingRef.current ||
      retryMutation.isPending
    ) {
      return
    }
    submittingRef.current = true
    retryMutation.mutate()
  }

  const imageUrl = entryImageUrl(candidate)

  return (
    <Modal
      open
      title={t(titleKey[candidate.reason])}
      onCancel={isPending ? undefined : onClose}
      closable={!isPending}
      mask={{ closable: false }}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4">
        <div className="flex h-80 items-center justify-center overflow-hidden rounded-lg border bg-black/2 p-2">
          {imageUrl ? (
            <AuthenticatedImage
              url={imageUrl}
              alt={t('entryCandidates.entryVehicle')}
              style={{ width: '100%', height: 304, objectFit: 'contain' }}
            />
          ) : (
            <Typography.Text type="secondary">
              {t('sessions.noImages')}
            </Typography.Text>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Typography.Text>
            {t('entryCandidates.cameraTime')}: {formatDate(candidate.camera_event_at)}
          </Typography.Text>
          {candidate.confidence !== null && (
            <Typography.Text type="secondary">
              {t('entryCandidates.confidence', {
                value: candidate.confidence,
              })}
            </Typography.Text>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Text strong>
            {t('entryCandidates.plateNumber')}
          </Typography.Text>
          <Input
            ref={inputRef}
            value={plate ?? ''}
            onChange={(event) => setPlate(event.target.value)}
            placeholder={t('entryCandidates.platePlaceholder')}
            disabled={isPending || Boolean(barrierStatus)}
            onPressEnter={submitAccept}
          />
          {!plate.trim() && (
            <Typography.Text type="danger">
              {t('entryCandidates.plateRequired')}
            </Typography.Text>
          )}
        </div>

        {declineConfirmOpen && !barrierStatus && (
          <Alert
            type="warning"
            showIcon
            title={t('entryCandidates.declineConfirmation')}
            action={
              <Space wrap>
                <Button
                  size="small"
                  disabled={isPending}
                  onClick={() => setDeclineConfirmOpen(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  size="small"
                  danger
                  type="primary"
                  loading={declineMutation.isPending}
                  onClick={submitDecline}
                >
                  {t('entryCandidates.confirmDecline')}
                </Button>
              </Space>
            }
          />
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {barrierStatus === 'failed' && !retryUnavailable ? (
            <Button
              block
              type="primary"
              size="large"
              loading={retryMutation.isPending}
              onClick={submitRetry}
            >
              {t('entryCandidates.retryBarrier')}
            </Button>
          ) : !barrierStatus ? (
            <Button
              block
              type="primary"
              size="large"
              className="bg-green-600! hover:bg-green-700!"
              loading={acceptMutation.isPending}
              disabled={!canAccept}
              onClick={submitAccept}
            >
              {t('entryCandidates.accept')}
            </Button>
          ) : null}
          {!barrierStatus && (
            <Button
              block
              size="large"
              danger
              disabled={isPending}
              onClick={() => setDeclineConfirmOpen(true)}
            >
              {t('entryCandidates.decline')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
