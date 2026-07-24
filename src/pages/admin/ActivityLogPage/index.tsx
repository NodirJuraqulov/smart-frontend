import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { Dayjs } from 'dayjs'
import { Card, DatePicker, Empty, Select, Space, Table } from 'antd'
import { getActivityLogs } from '@/api/activityLogs'
import PageHeader from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { ActivityLog } from '@/types/activityLog'
import { ACTION_LABEL_KEYS, getActionLabel } from './actionLabels'
import { buildColumns } from './columns'
import DetailsModal from './DetailsModal'

type ActionFilter = 'all' | string

export default function ActivityLogPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('activityLog.title'))

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all')
  const [date, setDate] = useState<Dayjs | null>(null)
  const [detailsLog, setDetailsLog] = useState<ActivityLog | null>(null)

  const logsQuery = useQuery({
    queryKey: [
      'activity-logs',
      { page, limit, actionFilter, date: date?.format('YYYY-MM-DD') },
    ],
    queryFn: () =>
      getActivityLogs({
        page,
        limit,
        action: actionFilter === 'all' ? undefined : actionFilter,
        date: date ? date.format('YYYY-MM-DD') : undefined,
      }),
  })

  const columns = buildColumns(t, setDetailsLog)

  return (
    <div className="p-6">
      <PageHeader title={t('activityLog.title')} />

      <Space wrap className="mb-4">
        <Select<ActionFilter>
          size="large"
          value={actionFilter}
          onChange={(value) => {
            setActionFilter(value)
            setPage(1)
          }}
          style={{ width: 260 }}
          options={[
            { value: 'all', label: t('common.statusAll') },
            ...Object.keys(ACTION_LABEL_KEYS).map((action) => ({
              value: action,
              label: getActionLabel(t, action),
            })),
          ]}
        />
        <DatePicker
          size="large"
          placeholder={t('activityLog.datePlaceholder')}
          value={date}
          onChange={(value) => {
            setDate(value)
            setPage(1)
          }}
        />
      </Space>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<ActivityLog>
          rowKey="id"
          columns={columns}
          dataSource={logsQuery.data?.logs ?? []}
          loading={logsQuery.isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: logsQuery.data?.pagination.page ?? page,
            pageSize: logsQuery.data?.pagination.limit ?? limit,
            total: logsQuery.data?.pagination.total ?? 0,
            onChange: (nextPage, nextLimit) => {
              setPage(nextPage)
              setLimit(nextLimit)
            },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('activityLog.emptyState')}
              />
            ),
          }}
        />
      </Card>

      <DetailsModal log={detailsLog} onClose={() => setDetailsLog(null)} />
    </div>
  )
}
