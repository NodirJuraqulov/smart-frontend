import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Popconfirm,
  Space,
  Table,
  Tag,
  type TableProps,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from '@/api/subscriptionPlans'
import { getErrorMessage } from '@/utils/apiError'
import { formatMoney } from '@/utils/format'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import type { SubscriptionPlan } from '@/types/subscriptionPlan'
import CreatePlanModal, { type CreatePlanFormValues } from './CreatePlanModal'
import EditPlanModal, { type EditPlanFormValues } from './EditPlanModal'

export default function PlansSection() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [createForm] = Form.useForm<CreatePlanFormValues>()
  const [editForm] = Form.useForm<EditPlanFormValues>()

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
  })

  useEffect(() => {
    if (editingPlan) {
      editForm.setFieldsValue({
        name: editingPlan.name,
        duration_days: editingPlan.duration_days,
        price: editingPlan.price,
      })
    }
  }, [editingPlan, editForm])

  const invalidatePlans = () =>
    queryClient.invalidateQueries({ queryKey: ['subscription-plans'] })

  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      message.success(t('subscriptions.planCreateSuccess'))
      invalidatePlans()
      setCreateOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.planCreateError')))
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateSubscriptionPlan,
    onSuccess: () => {
      message.success(t('subscriptions.planUpdateSuccess'))
      invalidatePlans()
      setEditingPlan(null)
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.planUpdateError')))
    },
  })

  const blockMutation = useMutation({
    mutationFn: updateSubscriptionPlan,
    onSuccess: () => {
      message.success(t('subscriptions.planBlockSuccess'))
      invalidatePlans()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.planBlockError')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      message.success(t('subscriptions.planDeleteSuccess'))
      invalidatePlans()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('subscriptions.planDeleteError'),
          t('subscriptions.planDeleteConflict'),
        ),
      )
    },
  })

  const columns: TableProps<SubscriptionPlan>['columns'] = [
    {
      title: t('subscriptions.planColumnName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('subscriptions.planColumnDuration'),
      dataIndex: 'duration_days',
      key: 'duration_days',
    },
    {
      title: t('subscriptions.planColumnPrice'),
      dataIndex: 'price',
      key: 'price',
      render: (value: number) => formatMoney(value),
    },
    {
      title: t('subscriptions.planColumnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getStatusTagStyle(!record.is_blocked, mode)}>
          {record.is_blocked
            ? t('subscriptions.planStatusBlocked')
            : t('subscriptions.planStatusActive')}
        </Tag>
      ),
    },
    {
      title: t('subscriptions.planColumnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingPlan(record)}
          >
            {t('subscriptions.planEditButton')}
          </Button>
          <Popconfirm
            title={
              record.is_blocked
                ? t('subscriptions.planUnblockConfirm')
                : t('subscriptions.planBlockConfirm')
            }
            onConfirm={() =>
              blockMutation.mutate({
                id: record.id,
                is_blocked: !record.is_blocked,
              })
            }
          >
            <Button
              size="small"
              icon={record.is_blocked ? <UnlockOutlined /> : <LockOutlined />}
              loading={
                blockMutation.isPending &&
                blockMutation.variables?.id === record.id
              }
              disabled={
                blockMutation.isPending &&
                blockMutation.variables?.id === record.id
              }
            >
              {record.is_blocked
                ? t('subscriptions.planUnblockButton')
                : t('subscriptions.planBlockButton')}
            </Button>
          </Popconfirm>
          <Popconfirm
            title={t('subscriptions.planDeleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
              disabled={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
            >
              {t('subscriptions.planDeleteButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      variant="borderless"
      title={t('subscriptions.plansTitle')}
      extra={
        <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          {t('subscriptions.planCreateButton')}
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table<SubscriptionPlan>
        rowKey="id"
        columns={columns}
        dataSource={plansQuery.data ?? []}
        loading={plansQuery.isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('subscriptions.planEmptyState')}
            />
          ),
        }}
      />

      <CreatePlanModal
        open={createOpen}
        form={createForm}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditPlanModal
        open={!!editingPlan}
        form={editForm}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingPlan(null)}
        onSubmit={(values) =>
          editingPlan &&
          updateMutation.mutate({ id: editingPlan.id, ...values })
        }
      />
    </Card>
  )
}
