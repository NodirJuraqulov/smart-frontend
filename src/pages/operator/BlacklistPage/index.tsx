import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Popconfirm,
  Table,
  Typography,
  type TableProps,
} from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  createBlacklistedVehicle,
  deleteBlacklistedVehicle,
  getBlacklistedVehicles,
  getBlacklistAttempts,
} from '@/api/blacklist'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PlateBadge from '@/components/PlateBadge'
import { useAppSelector } from '@/hooks/redux'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import type {
  BlacklistedVehicle,
  BlacklistAttempt,
  CreateBlacklistedVehiclePayload,
} from '@/types/blacklist'
import CreateBlacklistModal from './CreateBlacklistModal'

const ATTEMPTS_PAGE_SIZE = 20

function BlacklistContent({ orgId }: { orgId: number }) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [attemptsPage, setAttemptsPage] = useState(1)
  const [createForm] = Form.useForm<CreateBlacklistedVehiclePayload>()

  const vehiclesQuery = useQuery({
    queryKey: ['blacklist', orgId],
    queryFn: () => getBlacklistedVehicles(orgId),
  })

  const attemptsQuery = useQuery({
    queryKey: ['blacklist-attempts', orgId, attemptsPage],
    queryFn: () =>
      getBlacklistAttempts(orgId, {
        page: attemptsPage,
        limit: ATTEMPTS_PAGE_SIZE,
      }),
  })

  const createMutation = useMutation({
    mutationFn: (values: CreateBlacklistedVehiclePayload) =>
      createBlacklistedVehicle({ orgId, ...values }),
    onSuccess: () => {
      message.success(t('blacklist.createSuccess'))
      void queryClient.invalidateQueries({ queryKey: ['blacklist', orgId] })
      setCreateOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('blacklist.createError'),
          t('blacklist.createConflict'),
        ),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (blacklistId: number) =>
      deleteBlacklistedVehicle({ orgId, blacklistId }),
    onSuccess: () => {
      message.success(t('blacklist.deleteSuccess'))
      void queryClient.invalidateQueries({ queryKey: ['blacklist', orgId] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('blacklist.deleteError')))
    },
  })

  const vehicleColumns: TableProps<BlacklistedVehicle>['columns'] = [
    {
      title: t('blacklist.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('blacklist.columnReason'),
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('blacklist.columnCreatedAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('blacklist.columnActions'),
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title={t('blacklist.deleteConfirm')}
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
            {t('blacklist.deleteButton')}
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const attemptColumns: TableProps<BlacklistAttempt>['columns'] = [
    {
      title: t('blacklist.attemptColumnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('blacklist.attemptColumnDate'),
      dataIndex: 'attempted_at',
      key: 'attempted_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('blacklist.attemptColumnImage'),
      dataIndex: 'image_url',
      key: 'image_url',
      render: (value: string | null, record) =>
        value ? (
          <AuthenticatedImage
            url={value}
            alt={t('blacklist.attemptImageAlt', {
              plate: record.plate_number,
            })}
            style={{ width: 96, height: 64, objectFit: 'cover' }}
          />
        ) : (
          '—'
        ),
    },
  ]

  return (
    <>
      <Card
        variant="borderless"
        title={t('blacklist.listTitle')}
        extra={
          <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            {t('blacklist.createButton')}
          </Button>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table<BlacklistedVehicle>
          rowKey="id"
          columns={vehicleColumns}
          dataSource={vehiclesQuery.data ?? []}
          loading={vehiclesQuery.isLoading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('blacklist.emptyState')}
              />
            ),
          }}
        />
      </Card>

      <Card
        variant="borderless"
        title={t('blacklist.attemptsTitle')}
        styles={{ body: { padding: 0 } }}
      >
        <Table<BlacklistAttempt>
          rowKey="id"
          columns={attemptColumns}
          dataSource={attemptsQuery.data?.attempts ?? []}
          loading={attemptsQuery.isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: attemptsQuery.data?.pagination.page ?? attemptsPage,
            pageSize:
              attemptsQuery.data?.pagination.limit ?? ATTEMPTS_PAGE_SIZE,
            total: attemptsQuery.data?.pagination.total ?? 0,
            showSizeChanger: false,
            onChange: setAttemptsPage,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('blacklist.attemptsEmptyState')}
              />
            ),
          }}
        />
      </Card>

      <CreateBlacklistModal
        open={createOpen}
        form={createForm}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </>
  )
}

export default function BlacklistPage() {
  const { t } = useTranslation()
  const orgId = useAppSelector((state) => state.auth.user?.org_id) ?? null
  useDocumentTitle(t('blacklist.title'))

  return (
    <div className="flex flex-col gap-4 p-6">
      <Typography.Title level={3} className="m-0!">
        {t('blacklist.title')}
      </Typography.Title>
      {orgId != null && <BlacklistContent orgId={orgId} />}
    </div>
  )
}
