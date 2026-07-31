import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Descriptions,
  Empty,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  acceptExitCandidate,
  dismissExitCandidate,
  getExitCandidate,
  reassignExitCandidate,
} from '@/api/exitCandidates'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PlateBadge from '@/components/PlateBadge'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import type { ExitCandidate } from '@/types/exitCandidate'
import type { ParkingSession, SessionSource } from '@/types/parking'

interface Props {
  candidate: ExitCandidate | null
  activeSessions: ParkingSession[]
  onClose: () => void
}

type ResolutionAction =
  | { type: 'accept'; candidateId: number }
  | { type: 'reassign'; candidateId: number; sessionId: number }
  | { type: 'dismiss'; candidateId: number; note?: string }

const sourceKey: Record<SessionSource, string> = {
  regular: 'exitCandidates.sourceRegular',
  subscription: 'exitCandidates.sourceSubscription',
  vip: 'exitCandidates.sourceVip',
}

export default function ExitCandidateModal({
  candidate: initialCandidate,
  activeSessions,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'view' | 'reassign' | 'dismiss'>('view')
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [dismissNote, setDismissNote] = useState('')
  const submittingRef = useRef(false)

  const detailQuery = useQuery({
    queryKey: ['exit-candidates', 'detail', initialCandidate?.id],
    queryFn: () => getExitCandidate(initialCandidate!.id),
    enabled: Boolean(initialCandidate?.id),
    retry: false,
  })

  useEffect(() => {
    setMode('view')
    setSelectedSessionId(null)
    setDismissNote('')
    submittingRef.current = false
  }, [initialCandidate?.id])

  useEffect(() => {
    if (!detailQuery.error) return
    const status = isAxiosError(detailQuery.error)
      ? detailQuery.error.response?.status
      : undefined
    if (status !== 404 && status !== 409) return

    queryClient.invalidateQueries({ queryKey: ['exit-candidates'] })
    message.warning(
      getErrorMessage(
        detailQuery.error,
        t('exitCandidates.staleCandidateError'),
      ),
    )
    onClose()
  }, [detailQuery.error, message, onClose, queryClient, t])

  useEffect(() => {
    const latestCandidate = detailQuery.data?.candidate
    if (!latestCandidate || latestCandidate.status === 'pending') return

    queryClient.invalidateQueries({ queryKey: ['exit-candidates'] })
    message.warning(t('exitCandidates.staleCandidateError'))
    onClose()
  }, [detailQuery.data?.candidate, message, onClose, queryClient, t])

  const candidate = detailQuery.data?.candidate ?? initialCandidate
  const suggestions = detailQuery.data?.suggestions
  const activeById = useMemo(
    () => new Map(activeSessions.map((session) => [session.id, session])),
    [activeSessions],
  )
  const reassignmentSessions = useMemo(() => {
    const sessionsById = new Map<
      number,
      ParkingSession | NonNullable<typeof suggestions>[number]
    >()
    activeSessions.forEach((session) => sessionsById.set(session.id, session))
    suggestions?.forEach((session) => {
      if (!sessionsById.has(session.id)) sessionsById.set(session.id, session)
    })
    return [...sessionsById.values()]
  }, [activeSessions, suggestions])
  const matchedActiveSession = candidate?.matched_session_id
    ? activeById.get(candidate.matched_session_id)
    : undefined
  const matchedSession = candidate?.matched_session ?? null
  const canResolve = candidate?.status === 'pending'
  const canAccept =
    canResolve && matchedSession?.status === 'active'
  const selectedSession = selectedSessionId
    ? activeById.get(selectedSessionId)
    : undefined

  const refreshAfterResolution = () => {
    queryClient.invalidateQueries({ queryKey: ['exit-candidates'] })
    queryClient.invalidateQueries({ queryKey: ['parking', 'active'] })
    queryClient.invalidateQueries({ queryKey: ['parking', 'awaiting-payment'] })
    queryClient.invalidateQueries({ queryKey: ['parking', 'capacity'] })
    queryClient.invalidateQueries({ queryKey: ['reports', 'daily'] })
  }

  const resolutionMutation = useMutation({
    mutationFn: (action: ResolutionAction) => {
      if (action.type === 'accept') return acceptExitCandidate(action.candidateId)
      if (action.type === 'reassign') {
        return reassignExitCandidate(action.candidateId, action.sessionId)
      }
      return dismissExitCandidate(action.candidateId, action.note)
    },
    onSuccess: (_, action) => {
      refreshAfterResolution()
      message.success(
        t(
          action.type === 'dismiss'
            ? 'exitCandidates.dismissSuccess'
            : 'exitCandidates.resolveSuccess',
        ),
      )
      onClose()
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      if (status === 404 || status === 409) {
        refreshAfterResolution()
        message.warning(
          getErrorMessage(error, t('exitCandidates.staleCandidateError')),
        )
        onClose()
        return
      }
      message.error(getErrorMessage(error, t('exitCandidates.actionError')))
    },
    onSettled: () => {
      submittingRef.current = false
    },
  })

  const submit = (action: ResolutionAction) => {
    if (submittingRef.current || resolutionMutation.isPending) return
    submittingRef.current = true
    resolutionMutation.mutate(action)
  }

  const candidateImages = candidate
    ? [
        ['overviewImageUrl', 'exitCandidates.overviewImage'],
        ['vehicleImageUrl', 'exitCandidates.vehicleImage'],
        ['plateImageUrl', 'exitCandidates.plateImage'],
      ]
        .map(([field, labelKey]) => ({
          field,
          labelKey,
          url: candidate[field as keyof ExitCandidate] as string | null,
        }))
        .filter((image) => Boolean(image.url))
    : []

  const footer = candidate ? (
    mode === 'view' ? (
      <Space wrap>
        <Button
          danger
          disabled={!canResolve || resolutionMutation.isPending}
          onClick={() => setMode('dismiss')}
        >
          {t('exitCandidates.dismiss')}
        </Button>
        <Button
          disabled={!canResolve || resolutionMutation.isPending}
          onClick={() => setMode('reassign')}
        >
          {t('exitCandidates.chooseAnotherSession')}
        </Button>
        <Button
          type="primary"
          loading={resolutionMutation.isPending}
          disabled={!canAccept || resolutionMutation.isPending}
          onClick={() => submit({ type: 'accept', candidateId: candidate.id })}
        >
          {t('exitCandidates.accept')}
        </Button>
      </Space>
    ) : mode === 'reassign' ? (
      <Space wrap>
        <Button
          disabled={resolutionMutation.isPending}
          onClick={() => setMode('view')}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="primary"
          loading={resolutionMutation.isPending}
          disabled={!selectedSessionId || resolutionMutation.isPending}
          onClick={() =>
            selectedSessionId &&
            submit({
              type: 'reassign',
              candidateId: candidate.id,
              sessionId: selectedSessionId,
            })
          }
        >
          {t('exitCandidates.reassignAndAccept')}
        </Button>
      </Space>
    ) : (
      <Space wrap>
        <Button
          disabled={resolutionMutation.isPending}
          onClick={() => setMode('view')}
        >
          {t('common.cancel')}
        </Button>
        <Button
          danger
          type="primary"
          loading={resolutionMutation.isPending}
          disabled={resolutionMutation.isPending}
          onClick={() =>
            submit({
              type: 'dismiss',
              candidateId: candidate.id,
              note: dismissNote,
            })
          }
        >
          {t('exitCandidates.confirmDismiss')}
        </Button>
      </Space>
    )
  ) : null

  return (
    <Modal
      open={Boolean(initialCandidate)}
      title={t('exitCandidates.detailTitle')}
      onCancel={resolutionMutation.isPending ? undefined : onClose}
      closable={!resolutionMutation.isPending}
      mask={{ closable: !resolutionMutation.isPending }}
      footer={footer}
      width={920}
      destroyOnHidden
    >
      {detailQuery.isLoading && !candidate ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : candidate ? (
        <div className="flex flex-col gap-4">
          {detailQuery.isError && (
            <Alert
              type="error"
              showIcon
              title={t('exitCandidates.detailLoadError')}
            />
          )}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label={t('exitCandidates.detectedPlate')}>
              {candidate.detected_plate ? (
                <PlateBadge value={candidate.detected_plate} />
              ) : (
                t('exitCandidates.plateNotDetected')
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('exitCandidates.confidence')}>
              {candidate.confidence != null
                ? t('exitCandidates.confidenceValue', {
                    value: candidate.confidence,
                  })
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('exitCandidates.cameraTime')}>
              {formatDate(candidate.camera_event_at)}
            </Descriptions.Item>
            <Descriptions.Item label={t('exitCandidates.status')}>
              <Tag color="processing">{t('exitCandidates.statusPending')}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5} className="m-0!">
            {t('exitCandidates.exitImages')}
          </Typography.Title>
          {candidateImages.length ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {candidateImages.map((image) => (
                <section key={image.field} className="min-w-0">
                  <Typography.Text strong>{t(image.labelKey)}</Typography.Text>
                  <AuthenticatedImage
                    url={image.url}
                    alt={t(image.labelKey)}
                    style={{ maxHeight: 260, objectFit: 'contain' }}
                  />
                </section>
              ))}
            </div>
          ) : (
            <Empty description={t('sessions.noImages')} />
          )}

          <Typography.Title level={5} className="m-0!">
            {t('exitCandidates.matchedSession')}
          </Typography.Title>
          {matchedSession ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label={t('exitCandidates.sessionNumber')}>
                  #{matchedSession.id}
                </Descriptions.Item>
                <Descriptions.Item label={t('exitCandidates.sessionPlate')}>
                  <PlateBadge value={matchedSession.plate_number} />
                </Descriptions.Item>
                <Descriptions.Item label={t('exitCandidates.sessionSource')}>
                  {t(sourceKey[matchedSession.session_source])}
                </Descriptions.Item>
                <Descriptions.Item label={t('exitCandidates.enteredAt')}>
                  {formatDate(matchedSession.entered_at)}
                </Descriptions.Item>
                <Descriptions.Item label={t('exitCandidates.sessionStatus')}>
                  {t(
                    `exitCandidates.sessionStatus${matchedSession.status === 'active' ? 'Active' : matchedSession.status === 'awaiting_payment' ? 'AwaitingPayment' : 'Completed'}`,
                  )}
                </Descriptions.Item>
              </Descriptions>
              <section>
                <Typography.Text strong>
                  {t('exitCandidates.entryImage')}
                </Typography.Text>
                {matchedActiveSession?.entryOverviewImageUrl ||
                matchedActiveSession?.entryVehicleImageUrl ? (
                  <AuthenticatedImage
                    url={
                      matchedActiveSession.entryOverviewImageUrl ??
                      matchedActiveSession.entryVehicleImageUrl
                    }
                    alt={t('exitCandidates.entryImage')}
                  />
                ) : (
                  <Empty description={t('sessions.noImages')} />
                )}
              </section>
            </div>
          ) : (
            <Alert
              type="warning"
              showIcon
              title={t('exitCandidates.noMatchedSession')}
            />
          )}

          {mode === 'reassign' && (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <Typography.Title level={5} className="m-0!">
                {t('exitCandidates.chooseActiveSession')}
              </Typography.Title>
              <Select
                showSearch={{ optionFilterProp: 'label' }}
                value={selectedSessionId}
                onChange={setSelectedSessionId}
                placeholder={t('exitCandidates.searchSessionPlaceholder')}
                options={reassignmentSessions.map((session) => ({
                  value: session.id,
                  label: `${session.plate_number} — ${session.session_source ? t(sourceKey[session.session_source]) : '—'} — ${formatDate(session.entered_at)}`,
                }))}
              />
              {selectedSession && (
                <AuthenticatedImage
                  url={
                    selectedSession.entryOverviewImageUrl ??
                    selectedSession.entryVehicleImageUrl
                  }
                  alt={t('exitCandidates.entryImage')}
                  style={{ maxHeight: 240, objectFit: 'contain' }}
                />
              )}
            </div>
          )}

          {mode === 'dismiss' && (
            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <Alert
                type="warning"
                showIcon
                title={t('exitCandidates.dismissWarning')}
              />
              <Input.TextArea
                value={dismissNote}
                onChange={(event) => setDismissNote(event.target.value)}
                maxLength={500}
                showCount
                placeholder={t('exitCandidates.dismissNotePlaceholder')}
              />
            </div>
          )}
        </div>
      ) : (
        <Alert type="error" showIcon title={t('exitCandidates.detailLoadError')} />
      )}
    </Modal>
  )
}
