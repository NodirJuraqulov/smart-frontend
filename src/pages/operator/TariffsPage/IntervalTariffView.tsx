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
  type TableProps,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  createTariffInterval,
  deleteTariffInterval,
  getTariffIntervals,
  updateTariffInterval,
} from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { formatMoney } from '@/utils/format'
import type { TariffInterval } from '@/types/tariffInterval'
import CreateIntervalModal, {
  type IntervalFormValues,
} from '@/components/CreateIntervalModal'
import EditIntervalModal from '@/components/EditIntervalModal'

export default function IntervalTariffView() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingInterval, setEditingInterval] =
    useState<TariffInterval | null>(null)
  const [createForm] = Form.useForm<IntervalFormValues>()
  const [editForm] = Form.useForm<IntervalFormValues>()

  const intervalsQuery = useQuery({
    queryKey: ['tariff-intervals'],
    queryFn: () => getTariffIntervals(),
  })

  useEffect(() => {
    if (editingInterval) {
      editForm.setFieldsValue({
        from_minutes: editingInterval.from_minutes,
        to_minutes: editingInterval.to_minutes ?? undefined,
        price: editingInterval.price,
      })
    }
  }, [editingInterval, editForm])

  const invalidateIntervals = () =>
    queryClient.invalidateQueries({ queryKey: ['tariff-intervals'] })

  const createMutation = useMutation({
    mutationFn: (values: IntervalFormValues) =>
      createTariffInterval({
        from_minutes: values.from_minutes,
        to_minutes: values.to_minutes ?? null,
        price: values.price,
      }),
    onSuccess: () => {
      message.success(t('pricingMode.intervalCreateSuccess'))
      invalidateIntervals()
      setCreateOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('pricingMode.intervalCreateError')),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: IntervalFormValues & { id: number }) =>
      updateTariffInterval({
        id: values.id,
        from_minutes: values.from_minutes,
        to_minutes: values.to_minutes ?? null,
        price: values.price,
      }),
    onSuccess: () => {
      message.success(t('pricingMode.intervalUpdateSuccess'))
      invalidateIntervals()
      setEditingInterval(null)
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('pricingMode.intervalUpdateError')),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTariffInterval,
    onSuccess: () => {
      message.success(t('pricingMode.intervalDeleteSuccess'))
      invalidateIntervals()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('pricingMode.intervalDeleteError')),
      )
    },
  })

  const columns: TableProps<TariffInterval>['columns'] = [
    {
      title: t('pricingMode.fromMinuteLabel'),
      dataIndex: 'from_minutes',
      key: 'from_minutes',
    },
    {
      title: t('pricingMode.toMinuteLabel'),
      dataIndex: 'to_minutes',
      key: 'to_minutes',
      render: (value: number | null) =>
        value != null ? value : t('pricingMode.toMinuteInfinite'),
    },
    {
      title: t('pricingMode.intervalPriceLabel'),
      dataIndex: 'price',
      key: 'price',
      render: (value: number) => formatMoney(value),
    },
    {
      title: t('pricingMode.intervalColumnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingInterval(record)}
          >
            {t('pricingMode.intervalEditButton')}
          </Button>
          <Popconfirm
            title={t('pricingMode.intervalDeleteConfirm')}
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
              {t('pricingMode.intervalDeleteButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card variant="borderless">
      <div className="mb-3 flex justify-end">
        <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          {t('pricingMode.intervalCreateButton')}
        </Button>
      </div>
      <Table<TariffInterval>
        rowKey="id"
        columns={columns}
        dataSource={intervalsQuery.data ?? []}
        loading={intervalsQuery.isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('pricingMode.intervalEmptyState')}
            />
          ),
        }}
      />

      <CreateIntervalModal
        open={createOpen}
        form={createForm}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditIntervalModal
        open={!!editingInterval}
        form={editForm}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingInterval(null)}
        onSubmit={(values) =>
          editingInterval &&
          updateMutation.mutate({ id: editingInterval.id, ...values })
        }
      />
    </Card>
  )
}
