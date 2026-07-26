import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Spin, Typography, theme as antdTheme } from 'antd'
import { getDisplayStatus } from '@/api/publicDisplay'
import { usePublicDisplaySocket } from '@/hooks/usePublicDisplaySocket'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatMoney } from '@/utils/format'
import DisplayLayout from './DisplayLayout'

const WELCOME_DISPLAY_MS = 4000

export default function EntryDisplayPage() {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()
  const { orgId: orgIdParam } = useParams<{ orgId: string }>()
  const orgId = Number(orgIdParam)
  const queryClient = useQueryClient()

  const [welcomePlate, setWelcomePlate] = useState<string | null>(null)
  const welcomeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queryKey = ['publicDisplay', orgId]

  const statusQuery = useQuery({
    queryKey,
    queryFn: () => getDisplayStatus(orgId),
    enabled: Number.isInteger(orgId),
    retry: false,
    refetchInterval: 30000,
  })

  useDocumentTitle(
    `${t('publicDisplay.entryPageTitle')} — ${statusQuery.data?.orgName ?? ''}`,
  )

  const invalidateStatus = () => queryClient.invalidateQueries({ queryKey })

  const isConnected = usePublicDisplaySocket(orgId, {
    onEntryDetected: (plateNumber) => {
      setWelcomePlate(plateNumber)
      if (welcomeTimeoutRef.current) clearTimeout(welcomeTimeoutRef.current)
      welcomeTimeoutRef.current = setTimeout(
        () => setWelcomePlate(null),
        WELCOME_DISPLAY_MS,
      )
      invalidateStatus()
    },
    onParkingFull: () => invalidateStatus(),
    onExitCompleted: () => invalidateStatus(),
    onExitAwaitingPayment: () => invalidateStatus(),
  })

  useEffect(() => {
    return () => {
      if (welcomeTimeoutRef.current) clearTimeout(welcomeTimeoutRef.current)
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
  const isFull =
    data.capacity.total != null && data.capacity.occupied >= data.capacity.total

  return (
    <DisplayLayout orgName={data.orgName} isConnected={isConnected}>
      {welcomePlate ? (
        <Typography.Title style={{ fontSize: 56, margin: 0 }}>
          {t('publicDisplay.welcomeMessage', { plate: welcomePlate })}
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
            <Typography.Text style={{ fontSize: 24, opacity: 0.6 }}>
              {t('publicDisplay.capacityLabel')}:{' '}
              {t('publicDisplay.capacityValue', {
                occupied: data.capacity.occupied,
                total: data.capacity.total,
              })}
            </Typography.Text>
          )}
        </div>
      )}
    </DisplayLayout>
  )
}
