import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Table, Typography, type TableProps } from 'antd'
import { getCashCollections } from '@/api/cashCollections'
import { formatDate, formatMoney } from '@/utils/format'
import { palette } from '@/theme/palette'
import type { CashCollection } from '@/types/cashCollection'
import { collectionDifference } from './cashCollectionAccess'

interface Props {
  orgId: number
}

export default function CashCollectionHistoryTab({ orgId }: Props) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const historyQuery = useQuery({
    queryKey: ['cash-collections', 'list', orgId, { page, limit }],
    queryFn: () => getCashCollections({ orgId, page, limit }),
  })

  const columns: TableProps<CashCollection>['columns'] = [
    {
      title: t('cashCollections.columnDate'),
      key: 'period_end',
      render: (_, record) => formatDate(record.period_end),
    },
    {
      title: t('cashCollections.columnCollectedBy'),
      key: 'collected_by_name',
      render: (_, record) =>
        record.collected_by_name || t('cashCollections.unknownCollector'),
    },
    {
      title: t('cashCollections.columnExpected'),
      key: 'expected_amount',
      render: (_, record) => formatMoney(record.expected_amount),
    },
    {
      title: t('cashCollections.columnCollected'),
      key: 'collected_amount',
      render: (_, record) => formatMoney(record.collected_amount),
    },
    {
      title: t('cashCollections.columnDifference'),
      key: 'difference',
      render: (_, record) => {
        const difference = collectionDifference(record)
        return (
          <Typography.Text
            style={
              difference === 0 ? undefined : { color: palette.warning }
            }
          >
            {formatMoney(difference)}
          </Typography.Text>
        )
      },
    },
    {
      title: t('cashCollections.columnOnline'),
      key: 'online_amount_snapshot',
      render: (_, record) => formatMoney(record.online_amount_snapshot),
    },
    {
      title: t('cashCollections.columnNote'),
      key: 'note',
      render: (_, record) => record.note || '—',
    },
  ]

  return (
    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
      <Table<CashCollection>
        rowKey="id"
        columns={columns}
        dataSource={historyQuery.data?.collections ?? []}
        loading={historyQuery.isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          pageSize: limit,
          total: historyQuery.data?.pagination.total ?? 0,
          showSizeChanger: true,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage)
            setLimit(nextLimit)
          },
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('cashCollections.emptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
