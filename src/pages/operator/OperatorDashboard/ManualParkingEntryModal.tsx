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
  Select,
  Typography,
  type InputRef,
} from 'antd'
import {
  createManualParkingEntry,
  retryEntryBarrier,
} from '@/api/entryCandidates'
import { getErrorMessage } from '@/utils/apiError'
import type { ExitCandidateBarrierStatus } from '@/types/exitCandidate'
import type { ManualEntryReason } from '@/types/entryCandidate'

interface Props {
  open: boolean
  onClose: () => void
  onDataChanged: () => void
}

export default function ManualParkingEntryModal({
  open,
  onClose,
  onDataChanged,
}: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const inputRef = useRef<InputRef>(null)
  const submittingRef = useRef(false)
  const [plate, setPlate] = useState('')
  const [reason, setReason] =
    useState<ManualEntryReason>('camera_unavailable')
  const [note, setNote] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [barrierStatus, setBarrierStatus] =
    useState<Exclude<ExitCandidateBarrierStatus, 'opened'> | null>(null)
  const [retryUnavailable, setRetryUnavailable] = useState(false)

  useEffect(() => {
    if (!open) return
    setPlate('')
    setReason('camera_unavailable')
    setNote('')
    setSessionId(null)
    setBarrierStatus(null)
    setRetryUnavailable(false)
    submittingRef.current = false
  }, [open])

  const handleBarrierStatus = (
    status: ExitCandidateBarrierStatus,
    resolvedSessionId: number,
  ) => {
    if (status === 'opened') return false
    setSessionId(resolvedSessionId)
    setBarrierStatus(status)
    setRetryUnavailable(status !== 'failed')
    message.error(
      t(
        status === 'failed'
          ? 'entryCandidates.entrySavedBarrierFailed'
          : 'entryCandidates.entrySavedBarrierUnavailable',
      ),
    )
    return true
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createManualParkingEntry({
        plate_number: plate.trim(),
        reason,
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (data) => {
      onDataChanged()
      if (handleBarrierStatus(data.barrier_status, data.session_id)) return
      message.success(t('entryCandidates.manualSuccess'))
      onClose()
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        message.error(t('entryCandidates.plateAlreadyInside'))
        window.setTimeout(() => inputRef.current?.focus())
        return
      }
      message.error(getErrorMessage(error, t('entryCandidates.manualError')))
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
      onClose()
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

  const noteRequired = reason === 'other' && !note.trim()
  const canSubmit =
    Boolean(plate.trim()) && !noteRequired && !createMutation.isPending

  const submit = () => {
    if (!canSubmit || submittingRef.current) return
    submittingRef.current = true
    createMutation.mutate()
  }

  const retry = () => {
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

  const isPending = createMutation.isPending || retryMutation.isPending

  return (
    <Modal
      open={open}
      title={t('entryCandidates.manualTitle')}
      onCancel={isPending ? undefined : onClose}
      closable={!isPending}
      mask={{ closable: false }}
      footer={null}
      width={620}
      destroyOnHidden
    >
      <div className="flex flex-col gap-4">
        <Alert
          type="warning"
          showIcon
          title={t('entryCandidates.manualWarning')}
        />

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
            onPressEnter={submit}
          />
          {!plate.trim() && (
            <Typography.Text type="danger">
              {t('entryCandidates.plateRequired')}
            </Typography.Text>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Text strong>
            {t('entryCandidates.manualReason')}
          </Typography.Text>
          <Select
            value={reason}
            disabled={isPending || Boolean(barrierStatus)}
            onChange={setReason}
            options={[
              {
                value: 'camera_unavailable',
                label: t('entryCandidates.reasonCameraUnavailable'),
              },
              {
                value: 'other',
                label: t('entryCandidates.reasonOther'),
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Typography.Text strong>
            {t('entryCandidates.note')}
          </Typography.Text>
          <Input.TextArea
            value={note ?? ''}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('entryCandidates.notePlaceholder')}
            disabled={isPending || Boolean(barrierStatus)}
            maxLength={500}
          />
          {noteRequired && (
            <Typography.Text type="danger">
              {t('entryCandidates.noteRequired')}
            </Typography.Text>
          )}
        </div>

        {barrierStatus === 'failed' && !retryUnavailable ? (
          <Button
            block
            size="large"
            type="primary"
            loading={retryMutation.isPending}
            onClick={retry}
          >
            {t('entryCandidates.retryBarrier')}
          </Button>
        ) : !barrierStatus ? (
          <Button
            block
            size="large"
            type="primary"
            className="bg-green-600! hover:bg-green-700!"
            loading={createMutation.isPending}
            disabled={!canSubmit}
            onClick={submit}
          >
            {t('entryCandidates.manualSubmit')}
          </Button>
        ) : null}
      </div>
    </Modal>
  )
}
