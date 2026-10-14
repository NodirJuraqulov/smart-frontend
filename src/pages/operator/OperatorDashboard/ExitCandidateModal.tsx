import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  Modal,
  Radio,
  Segmented,
  Space,
  Typography,
} from 'antd'
import {
  confirmExitCandidate,
  forceOpenExitCandidate,
  previewExitSession,
  retryExitCandidateBarrier,
  searchExitCandidate,
} from '@/api/exitCandidates'
import { retryCardPayment } from '@/api/parking'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PaymentQrCode from '@/components/PaymentQrCode'
import PlateBadge from '@/components/PlateBadge'
import { useIsMountedRef } from '@/hooks/useIsMountedRef'
import { useCardPayments } from '@/hooks/useCardPayments'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate, formatMoney } from '@/utils/format'
import type {
  ExitCandidateImages,
  ExitCandidateMatchedSession,
  ExitCandidateNext,
  ExitCandidateSearchResult,
  ExitCandidateActiveSession,
  ExitCandidateBarrierStatus,
  ExitCandidateSessionOption,
  ExitCandidatePaymentMethod,
} from '@/types/exitCandidate'
import type { SessionSource } from '@/types/parking'

interface Props {
  candidate: ExitCandidateNext
  onClose: () => void
  onResolved: () => void
  onPendingRefresh: () => void
  onDataChanged: () => void
}

type SelectedSession = ExitCandidateMatchedSession | ExitCandidateSessionOption
type ModalMode = 'view' | 'search'
type SearchListMode = 'search' | 'active'
type SearchRequest = {
  candidateId: string
  requestId: number
  plate?: string
  silent?: boolean
}

const actionButtonHeightClass = 'h-8!'

const sourceKey: Record<SessionSource, string> = {
  regular: 'exitCandidates.sourceRegular',
  subscription: 'exitCandidates.sourceSubscription',
  vip: 'exitCandidates.sourceVip',
}

function imageUrl(images: ExitCandidateImages | null | undefined) {
  if (!images?.image_available) return null
  return images.overview_url ?? images.vehicle_url
}

function formatDuration(minutesValue: number, t: TFunction) {
  const minutes = Number.isFinite(minutesValue)
    ? Math.max(0, Math.floor(minutesValue))
    : 0
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remainingMinutes = minutes % 60
  if (days > 0) {
    return hours > 0
      ? t('exitCandidates.durationDaysHours', { days, hours })
      : t('exitCandidates.durationDays', { days })
  }
  if (hours > 0) {
    return remainingMinutes > 0
      ? t('exitCandidates.durationHoursMinutes', {
          hours,
          minutes: remainingMinutes,
        })
      : t('exitCandidates.durationHours', { hours })
  }
  return t('exitCandidates.durationMinutes', { minutes })
}

function VehicleImageBlock({
  title,
  images,
  emptyText,
}: {
  title: string
  images: ExitCandidateImages | null | undefined
  emptyText: string
}) {
  const url = imageUrl(images)
  return (
    <section className="min-w-0">
      <Typography.Title level={5} className="m-0! mb-2!">
        {title}
      </Typography.Title>
      <div className="flex h-64 items-center justify-center overflow-hidden rounded-lg border bg-black/2 p-2">
        {url ? (
          <AuthenticatedImage
            url={url}
            alt={title}
            style={{ width: '100%', height: 240, objectFit: 'contain' }}
          />
        ) : (
          <Typography.Text type="secondary">{emptyText}</Typography.Text>
        )}
      </div>
    </section>
  )
}

export default function ExitCandidateModal({
  candidate,
  onClose,
  onResolved,
  onPendingRefresh,
  onDataChanged,
}: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const { declinedPayments, markRetryStarted } = useCardPayments()
  const [mode, setMode] = useState<ModalMode>(
    candidate.matched_session ? 'view' : 'search',
  )
  const [selectedSession, setSelectedSession] =
    useState<ExitCandidateSessionOption | null>(null)
  const [selectedAt, setSelectedAt] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] =
    useState<Exclude<ExitCandidatePaymentMethod, 'emergency'> | null>(null)
  const [searchPlate, setSearchPlate] = useState<string>(
    candidate.suggested_plate ?? candidate.detected_plate ?? '',
  )
  const [searchResults, setSearchResults] = useState<
    ExitCandidateSearchResult[]
  >([])
  const [activeSessionOptions, setActiveSessionOptions] = useState<
    ExitCandidateActiveSession[]
  >([])
  const [searchListMode, setSearchListMode] =
    useState<SearchListMode>('search')
  const [barrierStatus, setBarrierStatus] =
    useState<Exclude<ExitCandidateBarrierStatus, 'opened'> | null>(null)
  const [retryUnavailable, setRetryUnavailable] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const candidateIdRef = useRef(candidate.candidate_id)
  const initializedCandidateIdRef = useRef(candidate.candidate_id)
  const autoSearchedCandidateIdsRef = useRef(new Set<string>())
  const searchRequestIdRef = useRef(0)
  const searchingRef = useRef(false)
  const submittingRef = useRef(false)
  const isMountedRef = useIsMountedRef()
  candidateIdRef.current = candidate.candidate_id

  useEffect(() => {
    if (initializedCandidateIdRef.current === candidate.candidate_id) return
    initializedCandidateIdRef.current = candidate.candidate_id
    setMode(candidate.matched_session ? 'view' : 'search')
    setSelectedSession(null)
    setSelectedAt(null)
    setPaymentMethod(null)
    setSearchPlate(
      candidate.suggested_plate ?? candidate.detected_plate ?? '',
    )
    setSearchResults([])
    setActiveSessionOptions([])
    setSearchListMode('search')
    setBarrierStatus(null)
    setRetryUnavailable(false)
    searchingRef.current = false
    submittingRef.current = false
  }, [candidate])

  useEffect(() => {
    if (candidate.matched_session) setMode('view')
  }, [candidate.matched_session])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(interval)
  }, [])

  const session: SelectedSession | null =
    selectedSession ?? candidate.matched_session
  const isReassigned = selectedSession !== null
  const isRegular = session?.session_source === 'regular'
  const entryImages = session?.entry_images
  const displayPlate = session?.plate_number ?? candidate.detected_plate ?? ''
  const amount = session?.tariff_snapshot_amount ?? null
  const numericSessionId = session ? Number(session.session_id) : null
  const declinedCardPayment =
    numericSessionId != null && Number.isFinite(numericSessionId)
      ? declinedPayments.get(numericSessionId)
      : undefined
  const isCurrentCandidateCardDeclined = Boolean(
    declinedCardPayment?.candidateId != null &&
      String(declinedCardPayment.candidateId) === candidate.candidate_id,
  )

  const durationText = useMemo(() => {
    if (!session) return '—'
    let minutes = session.duration_minutes
    if (!isReassigned && candidate.matched_session) {
      const eventTime = new Date(candidate.camera_event_at).getTime()
      const elapsed = Number.isNaN(eventTime)
        ? 0
        : Math.max(0, Math.floor((now - eventTime) / 60000))
      minutes = Math.max(0, candidate.matched_session.duration_minutes + elapsed)
    } else if (isReassigned && selectedAt !== null) {
      minutes += Math.max(0, Math.floor((now - selectedAt) / 60000))
    }
    return formatDuration(minutes, t)
  }, [candidate.camera_event_at, candidate.matched_session, isReassigned, now, selectedAt, session, t])

  const handleBarrierProblem = (status: ExitCandidateBarrierStatus) => {
    if (status === 'opened') return false
    setBarrierStatus(status)
    setRetryUnavailable(status !== 'failed')
    onPendingRefresh()
    message.error(
      t(
        status === 'failed'
          ? 'exitCandidates.paymentSavedBarrierFailed'
          : 'exitCandidates.barrierUnavailableAfterPayment',
      ),
    )
    return true
  }

  const handleConflict = (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 409) return false
    message.warning(t('exitCandidates.alreadyResolved'))
    onResolved()
    return true
  }

  const searchMutation = useMutation({
    mutationFn: ({ candidateId, plate }: SearchRequest) =>
      searchExitCandidate(candidateId, plate),
    onSuccess: (data, { candidateId, requestId, plate }) => {
      if (
        !isMountedRef.current ||
        candidateId !== candidateIdRef.current ||
        requestId !== searchRequestIdRef.current
      ) {
        return
      }
      if (plate) {
        setSearchResults(data.results)
        return
      }
      setActiveSessionOptions(data.active_sessions)
    },
    onError: (error, { candidateId, requestId, silent }) => {
      if (
        !isMountedRef.current ||
        candidateId !== candidateIdRef.current ||
        requestId !== searchRequestIdRef.current
      ) {
        return
      }
      if (silent) {
        setSearchListMode('search')
        return
      }
      message.error(getErrorMessage(error, t('exitCandidates.searchError')))
    },
    onSettled: (_data, _error, { candidateId, requestId }) => {
      if (
        candidateId !== candidateIdRef.current ||
        requestId !== searchRequestIdRef.current
      ) {
        return
      }
      searchingRef.current = false
    },
  })

  useEffect(() => {
    const candidateId = candidate.candidate_id
    if (
      candidate.matched_session ||
      autoSearchedCandidateIdsRef.current.has(candidateId)
    ) {
      return
    }
    autoSearchedCandidateIdsRef.current.add(candidateId)
    const detectedPlate = (
      candidate.suggested_plate ?? candidate.detected_plate ?? ''
    ).trim()
    const plate = detectedPlate.length >= 3 ? detectedPlate : undefined
    if (!plate) setSearchListMode('active')
    searchingRef.current = true
    const requestId = ++searchRequestIdRef.current
    searchMutation.mutate({ candidateId, requestId, plate, silent: true })
  }, [
    candidate.candidate_id,
    candidate.detected_plate,
    candidate.matched_session,
    candidate.suggested_plate,
    searchMutation,
  ])

  const confirmMutation = useMutation({
    mutationFn: () =>
      confirmExitCandidate(candidate.candidate_id, {
        ...(isReassigned && session
          ? { session_id: session.session_id }
          : {}),
        ...(isRegular && paymentMethod
          ? { payment_method: paymentMethod }
          : {}),
      }),
    onSuccess: (data) => {
      if (!isMountedRef.current) return
      onDataChanged()
      if (handleBarrierProblem(data.barrier_status)) return
      message.success(t('exitCandidates.confirmSuccess'))
      onResolved()
    },
    onError: (error) => {
      if (!isMountedRef.current) return
      if (handleConflict(error)) return
      message.error(getErrorMessage(error, t('exitCandidates.confirmError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const forceMutation = useMutation({
    mutationFn: () => forceOpenExitCandidate(candidate.candidate_id),
    onSuccess: (data) => {
      if (!isMountedRef.current) return
      if (handleBarrierProblem(data.barrier_status)) return
      message.success(t('exitCandidates.forceOpenSuccess'))
      onResolved()
    },
    onError: (error) => {
      if (!isMountedRef.current) return
      if (handleConflict(error)) return
      message.error(getErrorMessage(error, t('exitCandidates.forceOpenError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const retryMutation = useMutation({
    mutationFn: () => retryExitCandidateBarrier(candidate.candidate_id),
    onSuccess: (data) => {
      if (!isMountedRef.current) return
      if (handleBarrierProblem(data.barrier_status)) return
      message.success(t('exitCandidates.retrySuccess'))
      onResolved()
    },
    onError: (error) => {
      if (!isMountedRef.current) return
      if (isAxiosError(error) && error.response?.status === 400) {
        setRetryUnavailable(true)
      }
      message.error(getErrorMessage(error, t('exitCandidates.retryError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const retryCardMutation = useMutation({
    mutationFn: () => retryCardPayment(numericSessionId!),
    onSuccess: (data) => {
      if (!isMountedRef.current || !session) return
      const parsedCandidateId = Number(candidate.candidate_id)
      markRetryStarted({
        sessionId: data.session_id,
        candidateId: Number.isFinite(parsedCandidateId)
          ? parsedCandidateId
          : declinedCardPayment?.candidateId ?? null,
        operationNumber: data.operation_number,
        plateNumber: session.plate_number ?? candidate.detected_plate ?? '',
      })
    },
    onError: (error) => {
      if (!isMountedRef.current) return
      message.error(
        getErrorMessage(error, t('paymentMethod.retryCardError')),
      )
    },
  })

  const isResolving =
    confirmMutation.isPending ||
    forceMutation.isPending ||
    retryMutation.isPending ||
    retryCardMutation.isPending
  const canConfirm =
    candidate.status === 'pending' &&
    Boolean(session) &&
    (!isRegular || Boolean(paymentMethod)) &&
    !isResolving &&
    !barrierStatus
  const hasLinkedSession =
    selectedSession != null ||
    candidate.matched_session_id != null ||
    candidate.resolved_session_id != null ||
    candidate.matched_session != null
  const canForce =
    candidate.status === 'pending' && !forceMutation.isPending

  const submitConfirm = () => {
    if (!canConfirm || submittingRef.current) return
    submittingRef.current = true
    confirmMutation.mutate()
  }

  const submitForce = () => {
    if (!canForce || submittingRef.current) return
    submittingRef.current = true
    forceMutation.mutate()
  }

  const submitSearch = () => {
    const plate = searchPlate.trim()
    if (!plate || searchingRef.current || searchMutation.isPending) return
    searchingRef.current = true
    const requestId = ++searchRequestIdRef.current
    searchMutation.mutate({
      candidateId: candidate.candidate_id,
      requestId,
      plate,
    })
  }

  const submitRetry = () => {
    if (
      barrierStatus !== 'failed' ||
      retryUnavailable ||
      submittingRef.current ||
      retryMutation.isPending
    ) {
      return
    }
    submittingRef.current = true
    retryMutation.mutate()
  }

  const selectSession = (result: ExitCandidateSessionOption) => {
    setSelectedSession(result)
    setSelectedAt(Date.now())
    setPaymentMethod(null)
    setMode('view')
    void previewExitSession({
      candidateId: candidate.candidate_id,
      sessionId: result.session_id,
    }).catch((error: unknown) => {
      console.error(error)
    })
  }

  return (
    <Modal
      open
      title={t('exitCandidates.detailTitle')}
      onCancel={isResolving ? undefined : onClose}
      closable={!isResolving}
      mask={{ closable: false }}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <VehicleImageBlock
            title={t('exitCandidates.entryVehicle')}
            images={entryImages}
            emptyText={
              session
                ? t('sessions.noImages')
                : t('exitCandidates.vehicleNotSelected')
            }
          />
          <VehicleImageBlock
            title={t('exitCandidates.exitVehicle')}
            images={candidate.exit_images}
            emptyText={t('sessions.noImages')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            data-testid="exit-candidate-vehicle-details"
            size="small"
            title={t('exitCandidates.vehicleDetails')}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('exitCandidates.plateNumber')}>
                {displayPlate ? (
                  <PlateBadge value={displayPlate} />
                ) : (
                  t('exitCandidates.plateNotDetected')
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('exitCandidates.vehicleType')}>
                {session ? t(sourceKey[session.session_source]) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('exitCandidates.enteredAt')}>
                {session ? formatDate(session.entered_at) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label={t('exitCandidates.cameraTime')}>
                {formatDate(candidate.camera_event_at)}
              </Descriptions.Item>
              <Descriptions.Item label={t('exitCandidates.parkedDuration')}>
                {durationText}
              </Descriptions.Item>
              <Descriptions.Item
                label={t(
                  isReassigned
                    ? 'exitCandidates.amount'
                    : 'exitCandidates.finalAmount',
                )}
              >
                {amount != null ? formatMoney(amount) : '—'}
              </Descriptions.Item>
            </Descriptions>
            {session && isRegular && (
              <div className="flex flex-col gap-3 border-t pt-4">
                <Typography.Text strong>
                  {t('exitCandidates.paymentMethod')}
                </Typography.Text>
                <div className="flex flex-wrap items-center gap-2">
                  <Radio.Group
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button
                      className={actionButtonHeightClass}
                      value="cash"
                    >
                      {t('paymentMethod.cash')}
                    </Radio.Button>
                    <Radio.Button
                      className={actionButtonHeightClass}
                      value="online"
                    >
                      {t('paymentMethod.online')}
                    </Radio.Button>
                  </Radio.Group>
                </div>
                {isCurrentCandidateCardDeclined && (
                  <Alert
                    type="warning"
                    showIcon
                    title={t('paymentMethod.cardPaymentDeclined')}
                    description={t('paymentMethod.retryCardHint')}
                  />
                )}
              </div>
            )}
          </Card>

          <Card
            data-testid="exit-candidate-qr-column"
            size="small"
            className="h-full"
            styles={{
              body: {
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            }}
          >
            <div className="flex w-full items-center justify-center">
              <PaymentQrCode
                size="compact"
                alt={t('publicDisplay.paymentQrAlt')}
              />
            </div>
          </Card>
        </div>

        {mode === 'search' && (
          <Card size="small" title={t('exitCandidates.chooseAnotherSession')}>
            <div className="flex flex-col gap-4">
              <Segmented
                block
                value={searchListMode}
                options={[
                  {
                    value: 'search',
                    label: t('exitCandidates.searchTab'),
                  },
                  {
                    value: 'active',
                    label: t('exitCandidates.allActiveTab'),
                  },
                ]}
                onChange={(value) => {
                  const nextMode = value as SearchListMode
                  setSearchListMode(nextMode)
                  if (nextMode === 'active') {
                    searchingRef.current = true
                    const requestId = ++searchRequestIdRef.current
                    searchMutation.mutate({
                      candidateId: candidate.candidate_id,
                      requestId,
                    })
                  }
                }}
              />
              {searchListMode === 'search' && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={searchPlate ?? ''}
                    onChange={(event) => setSearchPlate(event.target.value)}
                    placeholder={t('exitCandidates.searchInputPlaceholder')}
                    onPressEnter={submitSearch}
                  />
                  <Button
                    type="primary"
                    loading={searchMutation.isPending}
                    disabled={!searchPlate.trim() || searchMutation.isPending}
                    onClick={submitSearch}
                  >
                    {t('exitCandidates.search')}
                  </Button>
                  {candidate.matched_session && (
                    <Button onClick={() => setMode('view')}>
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              )}
              {searchMutation.isSuccess &&
                (searchListMode === 'search'
                  ? searchResults.length === 0
                  : activeSessionOptions.length === 0) && (
                  <Empty description={t('exitCandidates.searchEmpty')} />
                )}
              {(searchListMode === 'search'
                ? searchResults.length > 0
                : activeSessionOptions.length > 0) && (
                <div
                  className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${
                    searchListMode === 'active'
                      ? 'max-h-96 overflow-y-auto pr-1'
                      : ''
                  }`}
                >
                  {(searchListMode === 'search'
                    ? searchResults
                    : activeSessionOptions
                  ).map((result) => (
                    <Card
                      key={result.session_id}
                      hoverable
                      size="small"
                      role="button"
                      tabIndex={0}
                      onClick={() => selectSession(result)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          selectSession(result)
                        }
                      }}
                    >
                      <div className="grid grid-cols-[96px_1fr] gap-3">
                        <div className="flex h-20 items-center justify-center overflow-hidden rounded border">
                          {imageUrl(result.entry_images) ? (
                            <AuthenticatedImage
                              url={imageUrl(result.entry_images)}
                              alt={t('exitCandidates.entryVehicle')}
                              preview={false}
                              style={{ height: 76, objectFit: 'contain' }}
                            />
                          ) : (
                            <Typography.Text type="secondary">
                              {t('sessions.noImages')}
                            </Typography.Text>
                          )}
                        </div>
                        <Space orientation="vertical" size={1}>
                          {result.plate_number ? (
                            <PlateBadge value={result.plate_number} />
                          ) : (
                            <Typography.Text type="secondary">
                              {t('exitCandidates.plateNotDetected')}
                            </Typography.Text>
                          )}
                          <Typography.Text>
                            {t(sourceKey[result.session_source])}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {formatDate(result.entered_at)}
                          </Typography.Text>
                          {'similarity_score' in result &&
                            typeof result.similarity_score === 'number' && (
                            <Typography.Text type="secondary">
                              {t('exitCandidates.similarity', {
                                value: result.similarity_score,
                              })}
                            </Typography.Text>
                            )}
                          <Typography.Text type="secondary">
                            {t('exitCandidates.parkedDuration')}:{' '}
                            {formatDuration(result.duration_minutes, t)}
                          </Typography.Text>
                          <Typography.Text strong>
                            {t('exitCandidates.estimatedAmount')}:{' '}
                            {formatMoney(result.tariff_snapshot_amount)}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {t('exitCandidates.estimatedAmountNote')}
                          </Typography.Text>
                        </Space>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {barrierStatus === 'failed' && !retryUnavailable ? (
            <Button
              block
              size="large"
              type="primary"
              danger
              loading={retryMutation.isPending}
              disabled={isResolving}
              onClick={submitRetry}
            >
              {t('exitCandidates.retryBarrier')}
            </Button>
          ) : !barrierStatus ? (
            <Button
              block
              size="large"
              type="primary"
              loading={confirmMutation.isPending}
              disabled={!canConfirm}
              onClick={submitConfirm}
            >
              {t('exitCandidates.confirmAndOpen')}
            </Button>
          ) : null}
          {isCurrentCandidateCardDeclined && (
            <Button
              block
              loading={retryCardMutation.isPending}
              disabled={isResolving}
              onClick={() => retryCardMutation.mutate()}
            >
              {t('paymentMethod.retryCardPayment')}
            </Button>
          )}
          <div
            className={`grid grid-cols-1 gap-3 ${
              hasLinkedSession ? '' : 'sm:grid-cols-2'
            }`}
          >
            <Button
              block
              disabled={isResolving || Boolean(barrierStatus)}
              onClick={() => setMode('search')}
            >
              {t('exitCandidates.chooseAnotherSession')}
            </Button>
            {!hasLinkedSession && (
              <div
                data-testid="exit-candidate-force-actions"
                className="flex flex-col gap-3 sm:flex-row"
              >
                <Button
                  className={`${actionButtonHeightClass} min-w-0 flex-1`}
                  danger
                  loading={forceMutation.isPending}
                  disabled={!canForce}
                  onClick={submitForce}
                >
                  {t('exitCandidates.forceOpen')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
