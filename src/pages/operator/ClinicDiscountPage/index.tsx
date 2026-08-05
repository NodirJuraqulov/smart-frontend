import { useTranslation } from 'react-i18next'
import { Tabs, Typography } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import PendingDiscountsTab from './PendingDiscountsTab'
import DiscountHistoryTab from './DiscountHistoryTab'

export default function ClinicDiscountPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('clinicDiscount.title'))

  return (
    <div className="p-6">
      <Typography.Title level={3} className="m-0!">
        {t('clinicDiscount.title')}
      </Typography.Title>

      <Tabs
        defaultActiveKey="pending"
        items={[
          {
            key: 'pending',
            label: t('clinicDiscount.pendingTab'),
            children: <PendingDiscountsTab />,
          },
          {
            key: 'history',
            label: t('clinicDiscount.historyTab'),
            children: <DiscountHistoryTab />,
          },
        ]}
      />
    </div>
  )
}
