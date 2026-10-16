import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Table, type TableProps } from 'antd'
import { getForcedOpenHistory } from '@/api/forcedOpenHistory'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PlateBadge from '@/components/PlateBadge'
import { formatDate } from '@/utils/format'
import type { ForcedOpenHistoryItem } from '@/types/forcedOpenHistory'

interface ForcedOpenHistoryTabProps {
  orgId: number | null
}

const DEFAULT_PAGE_SIZE = 20

export default function ForcedOpenHistoryTab({
  orgId,
}: ForcedOpenHistoryTabProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const historyQuery = useQuery({
    queryKey: ['forced-open-history', orgId, { page, limit }],
    queryFn: () => getForcedOpenHistory(orgId!, { page, limit }),
    enabled: orgId != null,
  })

  const columns: TableProps<ForcedOpenHistoryItem>['columns'] = [
    {
      title: t('sessions.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string | null) =>
        value ? <PlateBadge value={value} /> : '—',
    },
    {
      title: t('sessions.forcedOpenColumnTime'),
      dataIndex: 'resolved_at',
      key: 'resolved_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('sessions.forcedOpenColumnResolver'),
      dataIndex: 'resolved_by',
      key: 'resolved_by',
      render: (value: ForcedOpenHistoryItem['resolved_by']) =>
        value?.name || '—',
    },
    {
      title: t('sessions.forcedOpenColumnNote'),
      dataIndex: 'resolution_note',
      key: 'resolution_note',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('sessions.forcedOpenColumnImage'),
      dataIndex: 'image_url',
      key: 'image_url',
      render: (value: string | null, record) =>
        value ? (
          <AuthenticatedImage
            url={value}
            alt={t('sessions.forcedOpenImageAlt', {
              plate: record.plate_number || '—',
            })}
            style={{ width: 96, height: 64, objectFit: 'cover' }}
          />
        ) : (
          '—'
        ),
    },
  ]

  return (
    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
      <Table<ForcedOpenHistoryItem>
        rowKey="id"
        columns={columns}
        dataSource={historyQuery.data?.history ?? []}
        loading={historyQuery.isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: historyQuery.data?.pagination.page ?? page,
          pageSize: historyQuery.data?.pagination.limit ?? limit,
          total: historyQuery.data?.pagination.total ?? 0,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage)
            setLimit(nextLimit)
          },
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('sessions.forcedOpenEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
