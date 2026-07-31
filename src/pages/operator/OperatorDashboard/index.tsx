import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Form, Typography } from 'antd'
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
import type {
  ExitCandidate,
  ExitCandidatesResponse,
} from '@/types/exitCandidate'
import StatsRow from './StatsRow'
import DetectionFailedAlert from './DetectionFailedAlert'
import AwaitingPaymentsSection from './AwaitingPaymentsSection'
import ActiveSessionsTable from './ActiveSessionsTable'
import ManualEntryModal, { type ManualFormValues } from './ManualEntryModal'
import ExitCandidatesSection from './ExitCandidatesSection'
import { EXIT_CANDIDATES_QUERY_KEY } from './exitCandidateQueryKeys'

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

  const [detectionFailed, setDetectionFailed] =
    useState<DetectionFailedState | null>(null)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(
    null,
  )
  const notifiedCandidateIdsRef = useRef(new Set<number>())
  const resolvedCandidateIdsRef = useRef(new Set<number>())

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
    queryClient.invalidateQueries({ queryKey: ['parking', 'awaiting-payment'] })
    queryClient.invalidateQueries({ queryKey: ['parking', 'capacity'] })
    queryClient.invalidateQueries({ queryKey: ['reports', 'daily'] })
  }

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
    onAwaitingPayment: () => {
      invalidateResolvedExitData()
    },
    onExitCompleted: () => {
      invalidateResolvedExitData()
    },
    onExitCandidateCreated: (candidate: ExitCandidate) => {
      if (!canViewExitCandidates) return
      resolvedCandidateIdsRef.current.delete(candidate.id)
      queryClient.setQueryData<ExitCandidatesResponse>(
        EXIT_CANDIDATES_QUERY_KEY,
        (current) => {
          if (!current) return current
          const exists = current.candidates.some((item) => item.id === candidate.id)
          return {
            ...current,
            candidates: [
              candidate,
              ...current.candidates.filter((item) => item.id !== candidate.id),
            ],
            pagination: {
              ...current.pagination,
              total: exists
                ? current.pagination.total
                : current.pagination.total + 1,
            },
          }
        },
      )
      queryClient.invalidateQueries({ queryKey: EXIT_CANDIDATES_QUERY_KEY })
      setSelectedCandidateId((current) => current ?? candidate.id)
      if (!notifiedCandidateIdsRef.current.has(candidate.id)) {
        notifiedCandidateIdsRef.current.add(candidate.id)
        notification.warning({
          title: t('exitCandidates.newCandidateNotificationTitle'),
          description: t('exitCandidates.newCandidateNotificationDescription', {
            plate: candidate.detected_plate ?? t('exitCandidates.plateNotDetected'),
          }),
          placement: 'topRight',
          duration: 8,
        })
      }
    },
    onExitCandidateResolved: (payload) => {
      if (!canViewExitCandidates) return
      if (resolvedCandidateIdsRef.current.has(payload.candidateId)) return
      resolvedCandidateIdsRef.current.add(payload.candidateId)
      queryClient.setQueryData<ExitCandidatesResponse>(
        EXIT_CANDIDATES_QUERY_KEY,
        (current) =>
          current
            ? {
                ...current,
                candidates: current.candidates.filter(
                  (candidate) => candidate.id !== payload.candidateId,
                ),
                pagination: {
                  ...current.pagination,
                  total: Math.max(0, current.pagination.total - 1),
                },
              }
            : current,
      )
      queryClient.invalidateQueries({ queryKey: EXIT_CANDIDATES_QUERY_KEY })
      invalidateResolvedExitData()
      setSelectedCandidateId((current) =>
        current === payload.candidateId ? null : current,
      )
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
      <div className="flex items-center gap-3">
        <Typography.Title level={3} className="m-0!">
          {t('operatorDashboard.title')}
        </Typography.Title>
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

      {canViewExitCandidates && (
        <ExitCandidatesSection
          activeSessions={activeSessionsQuery.data ?? []}
          selectedCandidateId={selectedCandidateId}
          onSelectCandidate={setSelectedCandidateId}
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

      <AwaitingPaymentsSection />

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
    </div>
  )
}
