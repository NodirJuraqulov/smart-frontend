import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Descriptions, Empty, Skeleton, Typography } from 'antd'
import { getSettings } from '@/api/settings'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function OperatorSettingsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('operatorSettings.title'))

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(),
    retry: false,
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <Typography.Title level={3} className="m-0!">
        {t('operatorSettings.title')}
      </Typography.Title>

      <Card variant="borderless">
        {settingsQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : settingsQuery.data ? (
          <Descriptions column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label={t('operatorSettings.workHoursLabel')}>
              {settingsQuery.data.work_hours_enabled
                ? `${settingsQuery.data.work_start ?? '—'} – ${settingsQuery.data.work_end ?? '—'}`
                : t('operatorSettings.workHoursUnrestricted')}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('operatorSettings.emptyState')}
          />
        )}
      </Card>
    </div>
  )
}
