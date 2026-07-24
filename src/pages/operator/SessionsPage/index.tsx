import { useTranslation } from 'react-i18next'
import { Tabs, Typography } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import ActiveSessionsTab from './ActiveSessionsTab'
import HistorySessionsTab from './HistorySessionsTab'

export default function SessionsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('sessions.title'))

  return (
    <div className="p-6">
      <Typography.Title level={3} className="m-0!">
        {t('sessions.title')}
      </Typography.Title>

      <Tabs
        defaultActiveKey="active"
        items={[
          {
            key: 'active',
            label: t('sessions.activeTab'),
            children: <ActiveSessionsTab />,
          },
          {
            key: 'history',
            label: t('sessions.historyTab'),
            children: <HistorySessionsTab />,
          },
        ]}
      />
    </div>
  )
}
