import { useTranslation } from 'react-i18next'
import { Tabs, Typography } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAppSelector } from '@/hooks/redux'
import ActiveSessionsTab from './ActiveSessionsTab'
import HistorySessionsTab from './HistorySessionsTab'
import ForcedOpenHistoryTab from './ForcedOpenHistoryTab'

export default function SessionsPage() {
  const { t } = useTranslation()
  const user = useAppSelector((state) => state.auth.user)
  useDocumentTitle(t('sessions.title'))
  const canViewForcedOpenHistory = Boolean(
    user && ['owner', 'kassir', 'super_admin'].includes(user.role),
  )

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
          ...(canViewForcedOpenHistory
            ? [
                {
                  key: 'forced-open-history',
                  label: t('sessions.forcedOpenTab'),
                  children: (
                    <ForcedOpenHistoryTab orgId={user?.org_id ?? null} />
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
