import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  renewSubscription,
} from '@/api/subscriptions'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import PlateBadge from '@/components/PlateBadge'
import type { SubscriptionPlan } from '@/types/subscriptionPlan'
import type { Subscription, SubscriptionStatus } from '@/types/subscription'
import CreateSubscriptionModal, {
  type CreateSubscriptionFormValues,
} from './CreateSubscriptionModal'

type StatusFilter = 'all' | SubscriptionStatus

const EXPIRING_ROW_CLASS = 'subscription-row-expiring'

function getDaysLeft(endDate: string): number {
  const diffMs = new Date(endDate).getTime() - Date.now()
  return Math.ceil(diffMs / 86400000)
}

interface SubscribersSectionProps {
  plans: SubscriptionPlan[]
}

export default function SubscribersSection({ plans }: SubscribersSectionProps) {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [plateSearch, setPlateSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | number>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm<CreateSubscriptionFormValues>()

  const activePlans = plans.filter((plan) => !plan.is_blocked)

  const subscriptionsQuery = useQuery({
    queryKey: [
      'subscriptions',
      { plateSearch, planFilter, statusFilter },
    ],
    queryFn: () =>
      getSubscriptions({
        plate_number: plateSearch || undefined,
        plan_id: planFilter === 'all' ? undefined : planFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  const invalidateSubscriptions = () =>
    queryClient.invalidateQueries({ queryKey: ['subscriptions'] })

  const createMutation = useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      message.success(t('subscriptions.createSuccess'))
      invalidateSubscriptions()
      setCreateOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('subscriptions.createError'),
          t('subscriptions.createConflict'),
        ),
      )
    },
  })

  const renewMutation = useMutation({
    mutationFn: renewSubscription,
    onSuccess: () => {
      message.success(t('subscriptions.renewSuccess'))
      invalidateSubscriptions()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.renewError')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      message.success(t('subscriptions.deleteSuccess'))
      invalidateSubscriptions()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.deleteError')))
    },
  })

  const columns: TableProps<Subscription>['columns'] = [
    {
      title: t('subscriptions.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('subscriptions.columnPlan'),
      dataIndex: 'plan_name_snapshot',
      key: 'plan_name_snapshot',
    },
    {
      title: t('subscriptions.columnStartDate'),
      dataIndex: 'start_date',
      key: 'start_date',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('subscriptions.columnEndDate'),
      dataIndex: 'end_date',
      key: 'end_date',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('subscriptions.columnDaysLeft'),
      key: 'days_left',
      render: (_, record) => {
        const days = getDaysLeft(record.end_date)
        return t('subscriptions.daysLeftValue', { days: Math.max(days, 0) })
      },
    },
    {
      title: t('subscriptions.columnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getStatusTagStyle(record.status === 'active', mode)}>
          {record.status === 'active'
            ? t('subscriptions.statusActive')
            : t('subscriptions.statusExpired')}
        </Tag>
      ),
    },
    {
      title: t('subscriptions.columnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Popconfirm
            title={t('subscriptions.renewConfirm')}
            onConfirm={() => renewMutation.mutate(record.id)}
          >
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={
                renewMutation.isPending &&
                renewMutation.variables === record.id
              }
              disabled={
                renewMutation.isPending &&
                renewMutation.variables === record.id
              }
            >
              {t('subscriptions.renewButton')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('subscriptions.deleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              danger
              size="small"
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
              disabled={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
            >
              {t('subscriptions.deleteButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      variant="borderless"
      title={t('subscriptions.subscribersTitle')}
      extra={
        <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          {t('subscriptions.subscriberCreateButton')}
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Space wrap className="p-4">
        <Input.Search
          allowClear
          size="large"
          placeholder={t('subscriptions.searchPlaceholder')}
          onChange={(e) => setPlateSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Select<'all' | number>
          size="large"
          value={planFilter}
          onChange={setPlanFilter}
          style={{ width: 220 }}
          options={[
            { value: 'all', label: t('subscriptions.statusFilterAll') },
            ...plans.map((plan) => ({ value: plan.id, label: plan.name })),
          ]}
          placeholder={t('subscriptions.planFilterPlaceholder')}
        />
        <Select<StatusFilter>
          size="large"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: t('subscriptions.statusFilterAll') },
            { value: 'active', label: t('subscriptions.statusActive') },
            { value: 'expired', label: t('subscriptions.statusExpired') },
          ]}
        />
      </Space>

      <Table<Subscription>
        rowKey="id"
        columns={columns}
        dataSource={subscriptionsQuery.data ?? []}
        loading={subscriptionsQuery.isLoading}
        scroll={{ x: 'max-content' }}
        rowClassName={(record) =>
          record.status === 'active' && getDaysLeft(record.end_date) < 3
            ? EXPIRING_ROW_CLASS
            : ''
        }
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('subscriptions.emptyState')}
            />
          ),
        }}
      />

      <CreateSubscriptionModal
        open={createOpen}
        form={createForm}
        isPending={createMutation.isPending}
        activePlans={activePlans}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </Card>
  )
}
