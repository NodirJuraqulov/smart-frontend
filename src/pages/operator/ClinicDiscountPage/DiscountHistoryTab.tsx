import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Table, Tag, type TableProps } from 'antd'
import { getClinicDiscounts } from '@/api/clinicDiscounts'
import { useAppSelector } from '@/hooks/redux'
import { useTheme } from '@/contexts/ThemeContext'
import { getClinicDiscountStatusTagStyle } from '@/theme/statusColors'
import { formatDate } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import type { ClinicDiscount, ClinicDiscountStatus } from '@/types/clinicDiscount'

const STATUS_LABEL_KEY: Record<ClinicDiscountStatus, string> = {
  pending: 'clinicDiscount.statusPending',
  used: 'clinicDiscount.statusUsed',
  expired: 'clinicDiscount.statusExpired',
  cancelled: 'clinicDiscount.statusCancelled',
}

export default function DiscountHistoryTab() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const orgId = useAppSelector((state) => state.auth.user?.org_id) ?? null

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const historyQuery = useQuery({
    queryKey: ['clinic-discounts', orgId, 'all', { page, limit }],
    queryFn: () => getClinicDiscounts(orgId!, { status: 'all', page, limit }),
    enabled: orgId != null,
  })

  const columns: TableProps<ClinicDiscount>['columns'] = [
    {
      title: t('clinicDiscount.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('clinicDiscount.columnPercent'),
      dataIndex: 'discount_percent',
      key: 'discount_percent',
      render: (value: number) => `${value}%`,
    },
    {
      title: t('clinicDiscount.columnCreatedAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('clinicDiscount.columnSource'),
      dataIndex: 'source_reference',
      key: 'source_reference',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('clinicDiscount.columnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getClinicDiscountStatusTagStyle(record.status, mode)}>
          {t(STATUS_LABEL_KEY[record.status])}
        </Tag>
      ),
    },
    {
      title: t('clinicDiscount.columnUsedAt'),
      dataIndex: 'used_at',
      key: 'used_at',
      render: (value: string | null) => formatDate(value),
    },
    {
      title: t('clinicDiscount.columnUsedSession'),
      dataIndex: 'used_session_id',
      key: 'used_session_id',
      render: (value: number | null) => value ?? '—',
    },
  ]

  return (
    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
      <Table<ClinicDiscount>
        rowKey="id"
        columns={columns}
        dataSource={historyQuery.data?.discounts ?? []}
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
              description={t('clinicDiscount.historyEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
