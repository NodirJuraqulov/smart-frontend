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
  createVipVehicle,
  deleteVipVehicle,
  getVipVehicles,
  updateVipVehicle,
} from '@/api/vipVehicles'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import type { VipVehicle } from '@/types/vipVehicle'
import CreateVipModal, { type CreateVipFormValues } from './CreateVipModal'
import EditVipModal, { type EditVipFormValues } from './EditVipModal'

export default function VipSection() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VipVehicle | null>(
    null,
  )
  const [createForm] = Form.useForm<CreateVipFormValues>()
  const [editForm] = Form.useForm<EditVipFormValues>()

  const vehiclesQuery = useQuery({
    queryKey: ['vip-vehicles'],
    queryFn: getVipVehicles,
  })

  useEffect(() => {
    if (editingVehicle) {
      editForm.setFieldsValue({
        plate_number: editingVehicle.plate_number,
        note: editingVehicle.note ?? undefined,
      })
    }
  }, [editingVehicle, editForm])

  const invalidateVehicles = () =>
    queryClient.invalidateQueries({ queryKey: ['vip-vehicles'] })

  const createMutation = useMutation({
    mutationFn: createVipVehicle,
    onSuccess: () => {
      message.success(t('subscriptions.vipCreateSuccess'))
      invalidateVehicles()
      setCreateOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('subscriptions.vipCreateError'),
          t('subscriptions.vipCreateConflict'),
        ),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateVipVehicle,
    onSuccess: () => {
      message.success(t('subscriptions.vipUpdateSuccess'))
      invalidateVehicles()
      setEditingVehicle(null)
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.vipUpdateError')))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteVipVehicle,
    onSuccess: () => {
      message.success(t('subscriptions.vipDeleteSuccess'))
      invalidateVehicles()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('subscriptions.vipDeleteError')))
    },
  })

  const columns: TableProps<VipVehicle>['columns'] = [
    {
      title: t('subscriptions.vipColumnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('subscriptions.vipColumnNote'),
      dataIndex: 'note',
      key: 'note',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('subscriptions.vipColumnCreatedAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('subscriptions.vipColumnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingVehicle(record)}
          >
            {t('subscriptions.vipEditButton')}
          </Button>
          <Popconfirm
            title={t('subscriptions.vipDeleteConfirm')}
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
              {t('subscriptions.vipDeleteButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card
      variant="borderless"
      title={t('subscriptions.vipTitle')}
      extra={
        <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          {t('subscriptions.vipCreateButton')}
        </Button>
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table<VipVehicle>
        rowKey="id"
        columns={columns}
        dataSource={vehiclesQuery.data ?? []}
        loading={vehiclesQuery.isLoading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('subscriptions.vipEmptyState')}
            />
          ),
        }}
      />

      <CreateVipModal
        open={createOpen}
        form={createForm}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditVipModal
        open={!!editingVehicle}
        form={editForm}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingVehicle(null)}
        onSubmit={(values) =>
          editingVehicle &&
          updateMutation.mutate({ id: editingVehicle.id, ...values })
        }
      />
    </Card>
  )
}
