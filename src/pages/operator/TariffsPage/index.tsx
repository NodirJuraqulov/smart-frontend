import { useTranslation } from 'react-i18next'
import { Typography } from 'antd'
import { useAppSelector } from '@/hooks/redux'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import HourlyTariffCard from './HourlyTariffCard'
import IntervalTariffView from './IntervalTariffView'

export default function TariffsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('tariffs.title'))
  const pricingMode = useAppSelector((state) => state.auth.user?.pricing_mode)

  return (
    <div className="p-6">
      <Typography.Title level={3} className="mb-4!">
        {t('tariffs.title')}
      </Typography.Title>

      {pricingMode === 'interval' ? (
        <IntervalTariffView />
      ) : (
        <HourlyTariffCard />
      )}
    </div>
  )
}
