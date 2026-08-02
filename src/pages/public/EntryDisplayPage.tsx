import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Spin, Typography, theme as antdTheme } from 'antd'
import {
  getDisplayStatus,
  getEntryDisplayStatus,
} from '@/api/publicDisplay'
import { usePublicDisplaySocket } from '@/hooks/usePublicDisplaySocket'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { EntryDisplayFlowStatus } from '@/types/publicDisplay'
import { formatMoney } from '@/utils/format'
import {
  getPublicDisplayRemainingMs,
  isTransientPublicDisplayState,
} from '@/utils/publicDisplayStatus'
import DisplayLayout from './DisplayLayout'

function idleStatus(): EntryDisplayFlowStatus {
  return {
    state: 'idle',
    plate: null,
    barrier_status: null,
    updated_at: new Date().toISOString(),
  }
}

export default function EntryDisplayPage() {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()
  const { orgId: orgIdParam } = useParams<{ orgId: string }>()
  const orgId = Number(orgIdParam)
  const hasValidOrgId = Number.isInteger(orgId) && orgId > 0
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['publicDisplay', orgId] as const, [orgId])
  const flowQueryKey = useMemo(
    () => ['publicEntryDisplayStatus', orgId] as const,
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
    queryFn: () => getEntryDisplayStatus(orgId),
    enabled: hasValidOrgId,
    retry: false,
    refetchInterval: 5000,
  })

  useDocumentTitle(
    `${t('publicDisplay.entryPageTitle')} — ${statusQuery.data?.orgName ?? ''}`,
  )

  const isConnected = usePublicDisplaySocket(orgId, {
    onEntryStatusChanged: (status) => {
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
  const isFull =
    data.capacity.available != null && data.capacity.available <= 0

  return (
    <DisplayLayout orgName={data.orgName} isConnected={isConnected}>
      {flow.state === 'awaiting_operator' ? (
        <div className="flex flex-col items-center gap-4">
          <Typography.Title style={{ fontSize: 52, margin: 0 }}>
            {t('publicDisplay.awaitingOperatorTitle')}
          </Typography.Title>
          {flow.plate && (
            <Typography.Title level={2} style={{ fontSize: 44, margin: 0 }}>
              {flow.plate}
            </Typography.Title>
          )}
          <Typography.Text style={{ fontSize: 28, opacity: 0.7 }}>
            {t('publicDisplay.awaitingOperatorDescription')}
          </Typography.Text>
        </div>
      ) : flow.state === 'completed' ? (
        <Typography.Title style={{ fontSize: 56, margin: 0 }}>
          {flow.plate
            ? t('publicDisplay.welcomeMessage', { plate: flow.plate })
            : t('publicDisplay.entryCompletedMessage')}
        </Typography.Title>
      ) : flow.state === 'barrier_failed' ? (
        <div className="flex flex-col items-center gap-4">
          <Typography.Title
            style={{ fontSize: 52, margin: 0, color: token.colorWarning }}
          >
            {t('publicDisplay.barrierFailedTitle')}
          </Typography.Title>
          <Typography.Text style={{ fontSize: 28, opacity: 0.7 }}>
            {t('publicDisplay.barrierFailedDescription')}
          </Typography.Text>
        </div>
      ) : flow.state === 'declined' ? (
        <Typography.Title style={{ fontSize: 52, margin: 0 }}>
          {t('publicDisplay.entryDeclinedMessage')}
        </Typography.Title>
      ) : isFull ? (
        <div className="flex flex-col items-center gap-4">
          <Typography.Title
            style={{ fontSize: 64, margin: 0, color: token.colorError }}
          >
            {t('publicDisplay.parkingFullTitle')}
          </Typography.Title>
          <Typography.Text style={{ fontSize: 28, opacity: 0.7 }}>
            {t('publicDisplay.parkingFullDescription')}
          </Typography.Text>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8">
          {data.pricingMode === 'hourly' && data.hourlyTariff ? (
            <div className="flex flex-col items-center gap-2">
              <Typography.Text style={{ fontSize: 28, opacity: 0.6 }}>
                {t('publicDisplay.hourlyPriceLabel')}
              </Typography.Text>
              <Typography.Title level={1} style={{ fontSize: 72, margin: 0 }}>
                {t('publicDisplay.pricePerHour', {
                  price: formatMoney(data.hourlyTariff.price),
                })}
              </Typography.Title>
              {data.hourlyTariff.gracePeriodMinutes > 0 && (
                <Typography.Text style={{ fontSize: 24, opacity: 0.7 }}>
                  {t('publicDisplay.gracePeriodNote', {
                    minutes: data.hourlyTariff.gracePeriodMinutes,
                  })}
                </Typography.Text>
              )}
            </div>
          ) : data.intervalTariffs ? (
            <div className="flex flex-col items-center gap-3">
              <Typography.Text style={{ fontSize: 28, opacity: 0.6 }}>
                {t('publicDisplay.intervalTariffsTitle')}
              </Typography.Text>
              {data.intervalTariffs.map((tariff) => (
                <Typography.Text
                  key={tariff.fromMinutes}
                  style={{ fontSize: 32, fontWeight: 600 }}
                >
                  {tariff.toMinutes == null
                    ? t('publicDisplay.intervalRangeUnlimitedLabel', {
                        from: tariff.fromMinutes,
                      })
                    : t('publicDisplay.intervalRangeLabel', {
                        from: tariff.fromMinutes,
                        to: tariff.toMinutes,
                      })}
                  : {formatMoney(tariff.price)}
                </Typography.Text>
              ))}
            </div>
          ) : null}

          {data.capacity.total != null && (
            <div className="flex flex-col items-center gap-1">
              <Typography.Text style={{ fontSize: 24, opacity: 0.6 }}>
                {t('publicDisplay.capacityLabel')}:{' '}
                {t('publicDisplay.capacityValue', {
                  occupied: data.capacity.occupied,
                  total: data.capacity.total,
                })}
              </Typography.Text>
              {data.capacity.available != null && (
                <Typography.Text style={{ fontSize: 24, opacity: 0.6 }}>
                  {t('publicDisplay.availableCapacity', {
                    available: data.capacity.available,
                  })}
                </Typography.Text>
              )}
            </div>
          )}
        </div>
      )}
    </DisplayLayout>
  )
}
