import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Spin, Typography, theme as antdTheme } from 'antd'
import { getDisplayStatus } from '@/api/publicDisplay'
import { usePublicDisplaySocket } from '@/hooks/usePublicDisplaySocket'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate, formatDuration, formatMoney } from '@/utils/format'
import DisplayLayout from './DisplayLayout'

const COMPLETED_DISPLAY_MS = 4000

type ExitScreenState =
  | { type: 'idle' }
  | {
      type: 'awaiting_payment'
      plateNumber: string
      amount: number
      enteredAt: string
      durationMinutes: number
    }
  | { type: 'completed'; plateNumber: string }
  | { type: 'not_recognized'; plateNumber: string; message: string }

export default function ExitDisplayPage() {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()
  const { orgId: orgIdParam } = useParams<{ orgId: string }>()
  const orgId = Number(orgIdParam)

  const [screenState, setScreenState] = useState<ExitScreenState>({
    type: 'idle',
  })
  const completedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const statusQuery = useQuery({
    queryKey: ['publicDisplay', orgId],
    queryFn: () => getDisplayStatus(orgId),
    enabled: Number.isInteger(orgId),
    retry: false,
    refetchInterval: 30000,
  })

  useDocumentTitle(
    `${t('publicDisplay.exitPageTitle')} — ${statusQuery.data?.orgName ?? ''}`,
  )

  const isConnected = usePublicDisplaySocket(orgId, {
    onExitAwaitingPayment: (plateNumber, amount, enteredAt, durationMinutes) => {
      if (completedTimeoutRef.current) clearTimeout(completedTimeoutRef.current)
      setScreenState({
        type: 'awaiting_payment',
        plateNumber,
        amount,
        enteredAt,
        durationMinutes,
      })
    },
    onExitCompleted: (plateNumber) => {
      if (completedTimeoutRef.current) clearTimeout(completedTimeoutRef.current)
      setScreenState({ type: 'completed', plateNumber })
      completedTimeoutRef.current = setTimeout(
        () => setScreenState({ type: 'idle' }),
        COMPLETED_DISPLAY_MS,
      )
    },
    onPlateNotRecognized: (plateNumber, message) => {
      if (completedTimeoutRef.current) clearTimeout(completedTimeoutRef.current)
      setScreenState({ type: 'not_recognized', plateNumber, message })
    },
  })

  useEffect(() => {
    return () => {
      if (completedTimeoutRef.current) clearTimeout(completedTimeoutRef.current)
    }
  }, [])

  if (statusQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <DisplayLayout isConnected={isConnected}>
        <Typography.Title style={{ fontSize: 48, margin: 0 }}>
          {t('publicDisplay.loadErrorMessage')}
        </Typography.Title>
      </DisplayLayout>
    )
  }

  const data = statusQuery.data

  return (
    <DisplayLayout orgName={data.orgName} isConnected={isConnected}>
      {screenState.type === 'awaiting_payment' ? (
        <div className="flex flex-col items-center gap-4">
          <Typography.Title style={{ fontSize: 48, margin: 0 }}>
            {t('publicDisplay.awaitingPaymentTitle')}
          </Typography.Title>
          <Typography.Title level={2} style={{ fontSize: 40, margin: 0 }}>
            {screenState.plateNumber}
          </Typography.Title>
          <Typography.Title level={2} style={{ fontSize: 56, margin: 0 }}>
            {formatMoney(screenState.amount)}
          </Typography.Title>
          <Typography.Text style={{ fontSize: 24, opacity: 0.7 }}>
            {t('publicDisplay.parkedDurationLabel', {
              duration: formatDuration(screenState.durationMinutes),
            })}
          </Typography.Text>
          <Typography.Text style={{ fontSize: 20, opacity: 0.6 }}>
            {t('publicDisplay.enteredAtLabel', {
              time: formatDate(screenState.enteredAt),
            })}
          </Typography.Text>
          <Typography.Text style={{ fontSize: 24, opacity: 0.7 }}>
            {t('publicDisplay.awaitingPaymentWaitNote')}
          </Typography.Text>
        </div>
      ) : screenState.type === 'completed' ? (
        <Typography.Title style={{ fontSize: 56, margin: 0 }}>
          {t('publicDisplay.exitCompletedMessage')}
        </Typography.Title>
      ) : screenState.type === 'not_recognized' ? (
        <div className="flex flex-col items-center gap-4">
          <Typography.Title
            style={{ fontSize: 48, margin: 0, color: token.colorError }}
          >
            {t('publicDisplay.plateNotRecognizedTitle')}
          </Typography.Title>
          <Typography.Text style={{ fontSize: 28, opacity: 0.7 }}>
            {t('publicDisplay.plateNotRecognizedDescription')}
          </Typography.Text>
        </div>
      ) : (
        <Typography.Title style={{ fontSize: 48, margin: 0 }}>
          {t('publicDisplay.exitIdleMessage')}
        </Typography.Title>
      )}
    </DisplayLayout>
  )
}
