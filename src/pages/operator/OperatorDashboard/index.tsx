import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button, Form, Space, Typography } from 'antd'
import { getDailyReport } from '@/api/reports'
import {
  entryManual,
  exitManual,
  getActiveSessions,
  updateSessionPaymentMethod,
} from '@/api/parking'
import { useParkingSocket } from '@/hooks/useParkingSocket'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAppSelector } from '@/hooks/redux'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import ReceiptModal from '@/components/ReceiptModal'
import type { DetectionType, ParkingSession, Payment } from '@/types/parking'
import type { ExitCandidateCreatedEvent } from '@/types/exitCandidate'
import type { EntryCandidateCreatedEvent } from '@/types/entryCandidate'
import StatsRow from './StatsRow'
import DetectionFailedAlert from './DetectionFailedAlert'
import ActiveSessionsTable from './ActiveSessionsTable'
import ManualEntryModal, { type ManualFormValues } from './ManualEntryModal'
import ExitCandidateWorkflow from './ExitCandidateWorkflow'
import EntryCandidateWorkflow from './EntryCandidateWorkflow'
import ManualParkingEntryModal from './ManualParkingEntryModal'
import EmergencyBarrierAction from './EmergencyBarrierAction'

interface DetectionFailedState {
  type: DetectionType
  imageUrl: string
}

interface ReceiptState {
  session: ParkingSession
  payment: Payment
}

const ELAPSED_TICK_MS = 60000

export default function OperatorDashboard() {
  const { t } = useTranslation()
  useDocumentTitle(t('operatorDashboard.title'))
  const { message, notification } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const user = useAppSelector((state) => state.auth.user)
  const orgName = user?.org_name
  const canViewExitCandidates =
    user?.role === 'owner' || Boolean(user?.permissions?.can_view_sessions)
  const canOpenEmergencyBarrier = Boolean(
    user?.org_id != null &&
      ['owner', 'super_admin', 'operator'].includes(user.role),
  )

  const [detectionFailed, setDetectionFailed] =
    useState<DetectionFailedState | null>(null)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualParkingEntryOpen, setManualParkingEntryOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [newCandidateSignal, setNewCandidateSignal] = useState(0)
  const [exitStatusSignal, setExitStatusSignal] = useState(0)
  const [resolvedCandidateId, setResolvedCandidateId] = useState<string | null>(
    null,
  )
  const [newEntryCandidateSignal, setNewEntryCandidateSignal] = useState(0)
  const [entryStatusSignal, setEntryStatusSignal] = useState(0)
  const [resolvedEntryCandidateId, setResolvedEntryCandidateId] = useState<
    number | null
  >(null)
  const notifiedCandidateIdsRef = useRef(new Set<string>())
  const notifiedEntryCandidateIdsRef = useRef(new Set<string>())
  const activeReviewModalRef = useRef<'entry' | 'exit' | null>(null)

  const [manualForm] = Form.useForm<ManualFormValues>()

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), ELAPSED_TICK_MS)
    return () => clearInterval(interval)
  }, [])

  const dailyReportQuery = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => getDailyReport(),
    refetchInterval: 30000,
  })

  const activeSessionsQuery = useQuery({
    queryKey: ['parking', 'active'],
    queryFn: getActiveSessions,
    refetchInterval: 10000,
  })

  const invalidateParkingData = () => {
    queryClient.invalidateQueries({ queryKey: ['parking', 'active'] })
    queryClient.invalidateQueries({ queryKey: ['reports', 'daily'] })
  }

  const invalidateResolvedExitData = () => {
    queryClient.invalidateQueries({ queryKey: ['parking', 'active'] })
    queryClient.invalidateQueries({ queryKey: ['parking', 'capacity'] })
    queryClient.invalidateQueries({ queryKey: ['reports'] })
  }

  const requestEntryModal = useCallback(() => {
    if (
      activeReviewModalRef.current &&
      activeReviewModalRef.current !== 'entry'
    ) {
      return false
    }
    activeReviewModalRef.current = 'entry'
    return true
  }, [])

  const requestExitModal = useCallback(() => {
    if (
      activeReviewModalRef.current &&
      activeReviewModalRef.current !== 'exit'
    ) {
      return false
    }
    activeReviewModalRef.current = 'exit'
    return true
  }, [])

  const releaseEntryModal = useCallback(() => {
    if (activeReviewModalRef.current === 'entry') {
      activeReviewModalRef.current = null
    }
  }, [])

  const releaseExitModal = useCallback(() => {
    if (activeReviewModalRef.current === 'exit') {
      activeReviewModalRef.current = null
    }
  }, [])

  useParkingSocket({
    onEntry: (session, detected) => {
      if (detected) {
        notification.success({
          message: t('operatorDashboard.entryDetectedTitle'),
          description: t('operatorDashboard.entryDetectedDescription', {
            plate: session.plate_number,
            time: formatDate(session.entered_at),
          }),
          placement: 'topRight',
          duration: 6,
        })
        invalidateParkingData()
      }
    },
    onExit: (session, payment, detected) => {
      if (detected) {
        message.success(
          t('operatorDashboard.exitDetected', { plate: session.plate_number }),
        )
        invalidateParkingData()
        setReceipt({ session, payment })
      }
    },
    onDetectionFailed: (type, imageUrl) => {
      setDetectionFailed({ type, imageUrl })
    },
    onExitCompleted: () => {
      invalidateResolvedExitData()
      setExitStatusSignal((current) => current + 1)
    },
    onExitCandidateCreated: (candidate: ExitCandidateCreatedEvent) => {
      if (!canViewExitCandidates) return
      setNewCandidateSignal((current) => current + 1)
      const notificationKey = String(candidate.candidateId)
      if (!notifiedCandidateIdsRef.current.has(notificationKey)) {
        notifiedCandidateIdsRef.current.add(notificationKey)
        notification.warning({
          title: t('exitCandidates.newCandidateNotificationTitle'),
          description: t('exitCandidates.newCandidateNotificationDescription', {
            plate:
              candidate.detectedPlate ?? t('exitCandidates.plateNotDetected'),
          }),
          placement: 'topRight',
          duration: 8,
        })
      }
    },
    onExitCandidateResolved: (payload) => {
      if (!canViewExitCandidates) return
      setResolvedCandidateId(String(payload.candidateId))
      setExitStatusSignal((current) => current + 1)
      invalidateResolvedExitData()
    },
    onEntryCandidateCreated: (candidate: EntryCandidateCreatedEvent) => {
      if (!canViewExitCandidates) return
      setNewEntryCandidateSignal((current) => current + 1)
      const notificationKey = String(candidate.candidateId)
      if (!notifiedEntryCandidateIdsRef.current.has(notificationKey)) {
        notifiedEntryCandidateIdsRef.current.add(notificationKey)
        notification.warning({
          title: t('entryCandidates.newCandidateNotificationTitle'),
          description: t('entryCandidates.newCandidateNotificationDescription', {
            plate:
              candidate.detectedPlate ?? t('entryCandidates.plateNotDetected'),
          }),
          placement: 'topRight',
          duration: 8,
        })
      }
    },
    onEntryCandidateResolved: (payload) => {
      if (!canViewExitCandidates) return
      setResolvedEntryCandidateId(payload.candidateId)
      setEntryStatusSignal((current) => current + 1)
      invalidateResolvedExitData()
    },
    onRelayFailed: (direction) => {
      notification.warning({
        message: t('operatorDashboard.relayFailedTitle'),
        description: t('operatorDashboard.relayFailedDescription', {
          direction: t(
            direction === 'entry'
              ? 'operatorDashboard.directionEntryLabel'
              : 'operatorDashboard.directionExitLabel',
          ),
        }),
        placement: 'topRight',
        duration: 8,
      })
    },
    onWebhookParseFailed: (direction) => {
      notification.warning({
        message: t('operatorDashboard.webhookParseFailedTitle'),
        description: t('operatorDashboard.webhookParseFailedDescription', {
          direction: t(
            direction === 'entry'
              ? 'operatorDashboard.directionEntryLabel'
              : 'operatorDashboard.directionExitLabel',
          ),
        }),
        placement: 'topRight',
        duration: 8,
      })
    },
  })

  const entryMutation = useMutation({
    mutationFn: (plateNumber: string) => entryManual(plateNumber),
    onSuccess: () => {
      message.success(t('operatorDashboard.manualEntrySuccess'))
      invalidateParkingData()
      setManualModalOpen(false)
      setDetectionFailed(null)
      manualForm.resetFields()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operatorDashboard.manualEntryError')))
    },
  })

  const exitMutation = useMutation({
    mutationFn: (values: ManualFormValues) =>
      exitManual(values.plate_number, values.payment_method!),
    onSuccess: (data) => {
      message.success(t('operatorDashboard.manualExitSuccess'))
      invalidateParkingData()
      setReceipt(data)
      setManualModalOpen(false)
      setDetectionFailed(null)
      manualForm.resetFields()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operatorDashboard.manualExitError')))
    },
  })

  const confirmPaymentMethodMutation = useMutation({
    mutationFn: updateSessionPaymentMethod,
    onSuccess: (data) => {
      setReceipt(data)
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('paymentMethod.confirmError')),
      )
    },
  })

  const isManualPending = entryMutation.isPending || exitMutation.isPending

  const handleManualSubmit = (values: ManualFormValues) => {
    if (detectionFailed?.type === 'exit') {
      exitMutation.mutate(values)
    } else {
      entryMutation.mutate(values.plate_number)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={3} className="m-0!">
          {t('operatorDashboard.title')}
        </Typography.Title>
        {(canViewExitCandidates || canOpenEmergencyBarrier) && (
          <Space wrap>
            {canViewExitCandidates && (
              <Button
                size="small"
                onClick={() => setManualParkingEntryOpen(true)}
              >
                {t('entryCandidates.manualButton')}
              </Button>
            )}
            {canViewExitCandidates && (
              <EntryCandidateWorkflow
                newCandidateSignal={newEntryCandidateSignal}
                statusRefreshSignal={entryStatusSignal}
                resolvedCandidateId={resolvedEntryCandidateId}
                autoOpenBlocked={
                  manualModalOpen || manualParkingEntryOpen || Boolean(receipt)
                }
                requestModalOpen={requestEntryModal}
                releaseModal={releaseEntryModal}
                onDataChanged={invalidateResolvedExitData}
              />
            )}
            {canViewExitCandidates && (
              <ExitCandidateWorkflow
                newCandidateSignal={newCandidateSignal}
                statusRefreshSignal={exitStatusSignal}
                resolvedCandidateId={resolvedCandidateId}
                autoOpenBlocked={
                  manualModalOpen || manualParkingEntryOpen || Boolean(receipt)
                }
                requestModalOpen={requestExitModal}
                releaseModal={releaseExitModal}
                onDataChanged={invalidateResolvedExitData}
              />
            )}
            {canOpenEmergencyBarrier && user?.org_id != null && (
              <EmergencyBarrierAction orgId={user.org_id} />
            )}
          </Space>
        )}
      </div>

      <StatsRow
        isLoading={dailyReportQuery.isLoading}
        isError={dailyReportQuery.isError}
        data={dailyReportQuery.data}
      />

      {detectionFailed && (
        <DetectionFailedAlert
          type={detectionFailed.type}
          imageUrl={detectionFailed.imageUrl}
          onManualEntry={() => setManualModalOpen(true)}
          onClose={() => setDetectionFailed(null)}
        />
      )}

      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        session={receipt?.session ?? null}
        amount={receipt?.payment?.amount ?? null}
        paymentMethod={receipt?.payment?.payment_method ?? null}
        orgName={orgName}
        onConfirmPaymentMethod={(payment_method) =>
          receipt &&
          confirmPaymentMethodMutation.mutate({
            id: receipt.session.id,
            payment_method,
          })
        }
        isConfirmingPaymentMethod={confirmPaymentMethodMutation.isPending}
      />

      <ActiveSessionsTable
        dataSource={activeSessionsQuery.data ?? []}
        loading={activeSessionsQuery.isLoading}
        now={now}
      />

      <ManualEntryModal
        open={manualModalOpen}
        isExit={detectionFailed?.type === 'exit'}
        form={manualForm}
        isPending={isManualPending}
        onCancel={() => {
          setManualModalOpen(false)
          manualForm.resetFields()
        }}
        onSubmit={handleManualSubmit}
      />

      <ManualParkingEntryModal
        open={manualParkingEntryOpen}
        onClose={() => setManualParkingEntryOpen(false)}
        onDataChanged={invalidateResolvedExitData}
      />
    </div>
  )
}
