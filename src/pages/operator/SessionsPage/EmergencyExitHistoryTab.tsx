import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Table, Tag, type TableProps } from 'antd'
import { getEmergencyExitHistory } from '@/api/emergencyExitHistory'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PlateBadge from '@/components/PlateBadge'
import { formatDate } from '@/utils/format'
import type { EmergencyExitHistoryItem } from '@/types/emergencyExitHistory'

interface EmergencyExitHistoryTabProps {
  orgId: number | null
}

const DEFAULT_PAGE_SIZE = 20

export default function EmergencyExitHistoryTab({
  orgId,
}: EmergencyExitHistoryTabProps) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const historyQuery = useQuery({
    queryKey: ['emergency-exit-history', orgId, { page, limit }],
    queryFn: () => getEmergencyExitHistory(orgId!, { page, limit }),
    enabled: orgId != null,
  })

  const columns: TableProps<EmergencyExitHistoryItem>['columns'] = [
    {
      title: t('sessions.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string | null) =>
        value ? <PlateBadge value={value} /> : '—',
    },
    {
      title: t('sessions.forcedOpenColumnTime'),
      dataIndex: 'occurred_at',
      key: 'occurred_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('sessions.emergencyHistoryColumnResolver'),
      dataIndex: 'confirmed_by',
      key: 'confirmed_by',
      render: (value: EmergencyExitHistoryItem['confirmed_by']) =>
        value?.name || '—',
    },
    {
      title: t('sessions.emergencyHistoryColumnType'),
      dataIndex: 'type',
      key: 'type',
      render: (value: EmergencyExitHistoryItem['type']) => (
        <Tag color={value === 'confirmed' ? 'green' : 'red'}>
          {t(
            value === 'confirmed'
              ? 'sessions.emergencyHistoryTypeConfirmed'
              : 'sessions.emergencyHistoryTypeForcedOpen',
          )}
        </Tag>
      ),
    },
    {
      title: t('sessions.forcedOpenColumnImage'),
      dataIndex: 'image_url',
      key: 'image_url',
      render: (value: string | null, record) =>
        value ? (
          <AuthenticatedImage
            url={value}
            alt={t('sessions.emergencyHistoryImageAlt', {
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
      <Table<EmergencyExitHistoryItem>
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
              description={t('sessions.emergencyHistoryEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
