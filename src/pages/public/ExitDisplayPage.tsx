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
import { formatDuration, formatMoney } from '@/utils/format'
import {
  getPublicDisplayRemainingMs,
  isTransientPublicDisplayState,
} from '@/utils/publicDisplayStatus'
import DisplayLayout from './DisplayLayout'

function QRPaymentSlot({ flow }: { flow: ExitDisplayFlowStatus }) {
  const { t } = useTranslation()
  const message =
    flow.state === 'awaiting_operator'
      ? t('publicDisplay.operatorWorking')
      : flow.state === 'completed' &&
          (flow.session_source === 'vip' ||
            flow.session_source === 'subscription')
        ? t('publicDisplay.paymentNotRequired')
        : flow.state === 'completed' && flow.session_source === null
          ? t('publicDisplay.paymentWithOperator')
          : null

  return (
    <section className="flex min-h-80 flex-col items-center justify-center gap-6">
      {message && (
        <Typography.Title level={3} style={{ fontSize: 32, margin: 0 }}>
          {message}
        </Typography.Title>
      )}
      <PaymentQrCode
        size="display"
        label={t('publicDisplay.scanOnlinePayment')}
        alt={t('publicDisplay.paymentQrAlt')}
      />
    </section>
  )
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

  useDocumentTitle(
    `${t('publicDisplay.exitPageTitle')} — ${statusQuery.data?.orgName ?? ''}`,
  )

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

  const data = statusQuery.data
  const flow = flowQuery.data

  return (
    <DisplayLayout orgName={data.orgName} isConnected={isConnected}>
      <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col items-center justify-center">
          {flow.state === 'awaiting_operator' ? (
            <div className="flex flex-col items-center gap-4">
              <Typography.Title style={{ fontSize: 52, margin: 0 }}>
                {t('publicDisplay.awaitingOperatorTitle')}
              </Typography.Title>
              {flow.plate && (
                <Typography.Title
                  level={2}
                  style={{ fontSize: 44, margin: 0 }}
                >
                  {flow.plate}
                </Typography.Title>
              )}
              <Typography.Text style={{ fontSize: 28, opacity: 0.7 }}>
                {t('publicDisplay.awaitingOperatorDescription')}
              </Typography.Text>
            </div>
          ) : flow.state === 'completed' ? (
            <div className="flex flex-col items-center gap-4">
              <Typography.Title style={{ fontSize: 56, margin: 0 }}>
                {t('publicDisplay.exitCompletedMessage')}
              </Typography.Title>
              {flow.plate && (
                <Typography.Title
                  level={2}
                  style={{ fontSize: 42, margin: 0 }}
                >
                  {flow.plate}
                </Typography.Title>
              )}
              {flow.amount !== null && (
                <Typography.Title
                  level={2}
                  style={{ fontSize: 52, margin: 0 }}
                >
                  {formatMoney(flow.amount)}
                </Typography.Title>
              )}
              {flow.duration_minutes !== null && (
                <Typography.Text style={{ fontSize: 24, opacity: 0.7 }}>
                  {t('publicDisplay.parkedDurationLabel', {
                    duration: formatDuration(flow.duration_minutes),
                  })}
                </Typography.Text>
              )}
              {flow.payment_method && (
                <Typography.Text style={{ fontSize: 24, opacity: 0.7 }}>
                  {t('publicDisplay.paymentMethodLabel', {
                    method: t(
                      flow.payment_method === 'cash'
                        ? 'publicDisplay.cashPaymentMethod'
                        : 'publicDisplay.onlinePaymentMethod',
                    ),
                  })}
                </Typography.Text>
              )}
            </div>
          ) : flow.state === 'barrier_failed' ? (
            <div className="flex flex-col items-center gap-4">
              <Typography.Title
                style={{
                  fontSize: 52,
                  margin: 0,
                  color: token.colorWarning,
                }}
              >
                {t('publicDisplay.barrierFailedTitle')}
              </Typography.Title>
              <Typography.Text style={{ fontSize: 28, opacity: 0.7 }}>
                {t('publicDisplay.barrierFailedDescription')}
              </Typography.Text>
            </div>
          ) : flow.state === 'declined' ? (
            <Typography.Title style={{ fontSize: 52, margin: 0 }}>
              {t('publicDisplay.exitDeclinedMessage')}
            </Typography.Title>
          ) : (
            <Typography.Title style={{ fontSize: 48, margin: 0 }}>
              {t('publicDisplay.exitIdleMessage')}
            </Typography.Title>
          )}
        </div>
        <QRPaymentSlot flow={flow} />
      </div>
    </DisplayLayout>
  )
}
