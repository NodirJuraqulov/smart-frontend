import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Popconfirm,
  Space,
  Table,
  Tag,
  type TableProps,
} from 'antd'
import { confirmCashPayment, getAwaitingPayments } from '@/api/parking'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate, formatDuration, formatMoney } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import OpenBarrierAction from '@/components/OpenBarrierAction'
import type { AwaitingPaymentSession } from '@/types/parking'

const OVERDUE_ROW_CLASS = 'awaiting-payment-row-overdue'

export default function AwaitingPaymentsSection() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const queryKey = ['parking', 'awaiting-payment']

  const awaitingQuery = useQuery({
    queryKey,
    queryFn: getAwaitingPayments,
    refetchInterval: 5000,
  })

  const confirmMutation = useMutation({
    mutationFn: (id: number) => confirmCashPayment(id),
    onSuccess: () => {
      message.success(t('operatorDashboard.confirmCashPaymentSuccess'))
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['reports', 'daily'] })
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('operatorDashboard.confirmCashPaymentError')),
      )
    },
  })

  const columns: TableProps<AwaitingPaymentSession>['columns'] = [
    {
      title: t('sessions.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('sessions.columnExited'),
      key: 'exited_at',
      render: (_, record) => (
        <Space wrap size={4}>
          <span>{record.exited_at ? formatDate(record.exited_at) : '—'}</span>
          {record.is_overdue && (
            <Tag color="error">{t('operatorDashboard.overdueTag')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('sessions.columnDuration'),
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (value: number | null) =>
        value != null ? formatDuration(value) : '—',
    },
    {
      title: t('sessions.columnAmount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number | null) =>
        value != null ? formatMoney(value) : '—',
    },
    {
      title: t('sessions.columnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Popconfirm
            title={t('operatorDashboard.confirmCashPaymentConfirmTitle')}
            onConfirm={() => confirmMutation.mutate(record.id)}
            okText={t('operatorDashboard.confirmCashPaymentConfirmOk')}
            cancelText={t('common.cancel')}
          >
            <Button
              size="small"
              type="primary"
              loading={
                confirmMutation.isPending &&
                confirmMutation.variables === record.id
              }
              disabled={
                confirmMutation.isPending &&
                confirmMutation.variables !== record.id
              }
            >
              {t('operatorDashboard.confirmCashPaymentButton')}
            </Button>
          </Popconfirm>
          <OpenBarrierAction sessionId={record.id} />
        </Space>
      ),
    },
  ]

  return (
    <Card
      variant="borderless"
      title={t('operatorDashboard.awaitingPaymentsTitle')}
      styles={{ body: { padding: 0 } }}
    >
      <Table<AwaitingPaymentSession>
        rowKey="id"
        columns={columns}
        dataSource={awaitingQuery.data ?? []}
        loading={awaitingQuery.isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) => (record.is_overdue ? OVERDUE_ROW_CLASS : '')}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('operatorDashboard.awaitingPaymentsEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
