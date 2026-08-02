import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Spin, Typography, theme as antdTheme } from 'antd'
import { getDisplayStatus, getExitDisplayStatus } from '@/api/publicDisplay'
import PaymentQrCode from '@/components/PaymentQrCode'
import { usePublicDisplaySocket } from '@/hooks/usePublicDisplaySocket'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { ExitDisplayFlowStatus } from '@/types/publicDisplay'
import { formatDate, formatDuration, formatMoney } from '@/utils/format'
import {
  getPublicDisplayRemainingMs,
  isTransientPublicDisplayState,
} from '@/utils/publicDisplayStatus'
import DisplayLayout from './DisplayLayout'

function QRPaymentSlot() {
  const { t } = useTranslation()
  return (
    <section
      data-testid="exit-display-qr-section"
      className="flex min-h-0 flex-[2] items-center justify-center"
    >
      <PaymentQrCode
        size="display"
        alt={t('publicDisplay.paymentQrAlt')}
      />
    </section>
  )
}

const sourceKey = {
  regular: 'exitCandidates.sourceRegular',
  subscription: 'exitCandidates.sourceSubscription',
  vip: 'exitCandidates.sourceVip',
} as const

function completedEnteredAt(flow: ExitDisplayFlowStatus) {
  if (flow.duration_minutes === null) return null
  const completedAt = new Date(flow.updated_at).getTime()
  if (!Number.isFinite(completedAt)) return null
  return new Date(completedAt - flow.duration_minutes * 60000)
}

function idleStatus(): ExitDisplayFlowStatus {
  return {
    state: 'idle',
    plate: null,
    session_source: null,
    amount: null,
    payment_method: null,
    duration_minutes: null,
    barrier_status: null,
    updated_at: new Date().toISOString(),
  }
}

export default function ExitDisplayPage() {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()
  const { orgId: orgIdParam } = useParams<{ orgId: string }>()
  const orgId = Number(orgIdParam)
  const hasValidOrgId = Number.isInteger(orgId) && orgId > 0
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['publicDisplay', orgId] as const, [orgId])
  const flowQueryKey = useMemo(
    () => ['publicExitDisplayStatus', orgId] as const,
    [orgId],
  )

  const statusQuery = useQuery({
    queryKey,
    queryFn: () => getDisplayStatus(orgId),
    enabled: hasValidOrgId,
    retry: false,
    refetchInterval: 30000,
  })

  const flowQuery = useQuery({
    queryKey: flowQueryKey,
    queryFn: () => getExitDisplayStatus(orgId),
    enabled: hasValidOrgId,
    retry: false,
    refetchInterval: 5000,
  })

  useDocumentTitle(t('publicDisplay.exitPageTitle'))

  const isConnected = usePublicDisplaySocket(orgId, {
    onExitStatusChanged: (status) => {
      queryClient.setQueryData(flowQueryKey, status)
      if (status.state === 'completed') {
        queryClient.invalidateQueries({ queryKey })
      }
    },
  })

  useEffect(() => {
    const status = flowQuery.data
    if (!status || !isTransientPublicDisplayState(status.state)) return
    const remaining = getPublicDisplayRemainingMs(status.updated_at)
    if (remaining === 0) {
      queryClient.setQueryData(flowQueryKey, idleStatus())
      return
    }
    const timeout = setTimeout(() => {
      queryClient.setQueryData(flowQueryKey, idleStatus())
    }, remaining)
    return () => clearTimeout(timeout)
  }, [flowQuery.data, flowQueryKey, queryClient])

  if (statusQuery.isLoading || flowQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (
    statusQuery.isError ||
    flowQuery.isError ||
    !statusQuery.data ||
    !flowQuery.data
  ) {
    return (
      <DisplayLayout isConnected={isConnected}>
        <Typography.Title style={{ fontSize: 48, margin: 0 }}>
          {t('publicDisplay.loadErrorMessage')}
        </Typography.Title>
      </DisplayLayout>
    )
  }

  const flow = flowQuery.data

  return (
    <DisplayLayout isConnected={isConnected}>
      <div
        data-testid="exit-display-portrait-layout"
        className="flex min-h-[calc(100vh-10rem)] w-full flex-col"
      >
        <section
          data-testid="exit-display-status-section"
          className="flex min-h-0 flex-[3] flex-col items-center justify-center px-4 py-8"
        >
          {flow.state === 'awaiting_operator' ? (
            <div className="flex flex-col items-center gap-8">
              <Typography.Title
                data-testid="exit-display-status-title"
                style={{ fontSize: 68, margin: 0 }}
              >
                {t('publicDisplay.awaitingOperatorTitle')}
              </Typography.Title>
              {flow.plate && (
                <Typography.Title
                  level={2}
                  style={{ fontSize: 64, margin: 0 }}
                >
                  {flow.plate}
                </Typography.Title>
              )}
              <Typography.Text style={{ fontSize: 38, opacity: 0.8 }}>
                {t('publicDisplay.operatorWorking')}
              </Typography.Text>
            </div>
          ) : flow.state === 'completed' ? (
            <div className="flex w-full flex-col items-center gap-6">
              <Typography.Title
                data-testid="exit-display-status-title"
                style={{ fontSize: 68, margin: 0 }}
              >
                {t('publicDisplay.exitCompletedMessage')}
              </Typography.Title>
              {flow.plate && (
                <Typography.Title
                  level={2}
                  style={{ fontSize: 64, margin: 0 }}
                >
                  {flow.plate}
                </Typography.Title>
              )}
              <div className="grid w-full max-w-3xl grid-cols-1 gap-x-12 gap-y-4 text-left sm:grid-cols-2">
                {flow.session_source && (
                  <Typography.Text style={{ fontSize: 32 }}>
                    {t('exitCandidates.vehicleType')}:{' '}
                    <strong>{t(sourceKey[flow.session_source])}</strong>
                  </Typography.Text>
                )}
                {flow.duration_minutes !== null && (
                  <Typography.Text style={{ fontSize: 32 }}>
                    {t('publicDisplay.enteredAtLabel', {
                      time: formatDate(completedEnteredAt(flow)),
                    })}
                  </Typography.Text>
                )}
                {flow.duration_minutes !== null && (
                  <Typography.Text style={{ fontSize: 32 }}>
                    {t('publicDisplay.parkedDurationLabel', {
                      duration: formatDuration(flow.duration_minutes),
                    })}
                  </Typography.Text>
                )}
                {flow.payment_method && (
                  <Typography.Text style={{ fontSize: 32 }}>
                    {t('publicDisplay.paymentMethodLabel', {
                      method: t(
                        flow.payment_method === 'cash'
                          ? 'publicDisplay.cashPaymentMethod'
                          : 'publicDisplay.onlinePaymentMethod',
                      ),
                    })}
                  </Typography.Text>
                )}
                {flow.amount !== null && (
                  <div className="flex flex-col items-center sm:col-span-2">
                    <Typography.Text style={{ fontSize: 30 }}>
                      {t('exitCandidates.finalAmount')}
                    </Typography.Text>
                    <Typography.Title
                      level={2}
                      style={{ fontSize: 60, margin: 0, textAlign: 'center' }}
                    >
                      {formatMoney(flow.amount)}
                    </Typography.Title>
                  </div>
                )}
                {flow.session_source && flow.session_source !== 'regular' && (
                  <Typography.Text
                    className="sm:col-span-2"
                    style={{ fontSize: 32, textAlign: 'center' }}
                  >
                    {t('publicDisplay.paymentNotRequired')}
                  </Typography.Text>
                )}
              </div>
            </div>
          ) : flow.state === 'barrier_failed' ? (
            <div className="flex flex-col items-center gap-6">
              <Typography.Title
                data-testid="exit-display-status-title"
                style={{ fontSize: 68, margin: 0, color: token.colorWarning }}
              >
                {t('publicDisplay.barrierFailedTitle')}
              </Typography.Title>
              <Typography.Text style={{ fontSize: 38, opacity: 0.8 }}>
                {t('publicDisplay.barrierFailedDescription')}
              </Typography.Text>
            </div>
          ) : flow.state === 'declined' ? (
            <Typography.Title
              data-testid="exit-display-status-title"
              style={{ fontSize: 68, margin: 0 }}
            >
              {t('publicDisplay.exitDeclinedMessage')}
            </Typography.Title>
          ) : (
            <Typography.Title
              data-testid="exit-display-status-title"
              style={{ fontSize: 68, margin: 0 }}
            >
              {t('publicDisplay.exitIdleMessage')}
            </Typography.Title>
          )}
        </section>
        <QRPaymentSlot />
      </div>
    </DisplayLayout>
  )
}
