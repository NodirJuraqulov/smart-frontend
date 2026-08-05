import { useTranslation } from 'react-i18next'
import { Tabs, Typography } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import VipSection from './VipSection'
import InpatientVehiclesTab from './InpatientVehiclesTab'

export default function VipVehiclesPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('vipVehicles.title'))

  return (
    <div className="p-6">
      <Typography.Title level={3} className="m-0!">
        {t('vipVehicles.title')}
      </Typography.Title>

      <Tabs
        defaultActiveKey="vip"
        items={[
          {
            key: 'vip',
            label: t('vipVehicles.vipTab'),
            children: <VipSection />,
          },
          {
            key: 'inpatient',
            label: t('vipVehicles.inpatientTab'),
            children: <InpatientVehiclesTab />,
          },
        ]}
      />
    </div>
  )
}
