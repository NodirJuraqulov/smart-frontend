import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Popconfirm,
  Table,
  type TableProps,
} from 'antd'
import { cancelClinicDiscount, getClinicDiscounts } from '@/api/clinicDiscounts'
import { useAppSelector } from '@/hooks/redux'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import type { ClinicDiscount } from '@/types/clinicDiscount'

export default function PendingDiscountsTab() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const role = useAppSelector((state) => state.auth.user?.role)
  const orgId = useAppSelector((state) => state.auth.user?.org_id) ?? null
  const canCancel = role === 'owner' || role === 'super_admin'

  const pendingQuery = useQuery({
    queryKey: ['clinic-discounts', orgId, 'pending'],
    queryFn: () => getClinicDiscounts(orgId!, { status: 'pending' }),
    enabled: orgId != null,
  })

  const cancelMutation = useMutation({
    mutationFn: (discountId: number) =>
      cancelClinicDiscount({ orgId: orgId!, discountId }),
    onSuccess: () => {
      message.success(t('clinicDiscount.cancelSuccess'))
      void queryClient.invalidateQueries({ queryKey: ['clinic-discounts', orgId] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('clinicDiscount.cancelError')))
    },
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
    ...(canCancel
      ? [
          {
            title: t('clinicDiscount.columnActions'),
            key: 'actions',
            render: (_: unknown, record: ClinicDiscount) => (
              <Popconfirm
                title={t('clinicDiscount.cancelConfirm')}
                onConfirm={() => cancelMutation.mutate(record.id)}
              >
                <Button
                  danger
                  size="small"
                  loading={
                    cancelMutation.isPending &&
                    cancelMutation.variables === record.id
                  }
                  disabled={
                    cancelMutation.isPending &&
                    cancelMutation.variables === record.id
                  }
                >
                  {t('clinicDiscount.cancelButton')}
                </Button>
              </Popconfirm>
            ),
          },
        ]
      : []),
  ]

  return (
    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
      <Table<ClinicDiscount>
        rowKey="id"
        columns={columns}
        dataSource={pendingQuery.data?.discounts ?? []}
        loading={pendingQuery.isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('clinicDiscount.pendingEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
