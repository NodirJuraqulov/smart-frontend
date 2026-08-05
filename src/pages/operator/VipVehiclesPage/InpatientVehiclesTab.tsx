import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  type TableProps,
} from 'antd'
import {
  cancelInpatientVehicle,
  getInpatientVehicles,
} from '@/api/inpatientVehicles'
import { useAppSelector } from '@/hooks/redux'
import { useTheme } from '@/contexts/ThemeContext'
import { getInpatientVehicleStatusTagStyle } from '@/theme/statusColors'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import type {
  InpatientVehicle,
  InpatientVehicleStatus,
} from '@/types/inpatientVehicle'

type StatusFilter = 'active' | 'all'

const STATUS_LABEL_KEY: Record<InpatientVehicleStatus, string> = {
  active: 'vipVehicles.inpatientStatusActive',
  expired: 'vipVehicles.inpatientStatusExpired',
  cancelled: 'vipVehicles.inpatientStatusCancelled',
}

function getDaysLeft(validUntil: string): number {
  const diffMs = new Date(validUntil).getTime() - Date.now()
  return Math.ceil(diffMs / 86400000)
}

export default function InpatientVehiclesTab() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const role = useAppSelector((state) => state.auth.user?.role)
  const orgId = useAppSelector((state) => state.auth.user?.org_id) ?? null
  const canCancel = role === 'owner' || role === 'super_admin'

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const vehiclesQuery = useQuery({
    queryKey: ['inpatient-vehicles', orgId, statusFilter, { page, limit }],
    queryFn: () =>
      getInpatientVehicles(orgId!, { status: statusFilter, page, limit }),
    enabled: orgId != null,
  })

  const cancelMutation = useMutation({
    mutationFn: (vehicleId: number) =>
      cancelInpatientVehicle({ orgId: orgId!, vehicleId }),
    onSuccess: () => {
      message.success(t('vipVehicles.inpatientCancelSuccess'))
      void queryClient.invalidateQueries({
        queryKey: ['inpatient-vehicles', orgId],
      })
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('vipVehicles.inpatientCancelError')),
      )
    },
  })

  const columns: TableProps<InpatientVehicle>['columns'] = [
    {
      title: t('vipVehicles.inpatientColumnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('vipVehicles.inpatientColumnPatientName'),
      dataIndex: 'patient_name',
      key: 'patient_name',
      render: (value: string | null) => value || '—',
    },
    {
      title: t('vipVehicles.inpatientColumnValidFrom'),
      dataIndex: 'valid_from',
      key: 'valid_from',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('vipVehicles.inpatientColumnValidUntil'),
      dataIndex: 'valid_until',
      key: 'valid_until',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('vipVehicles.inpatientColumnDaysLeft'),
      key: 'days_left',
      render: (_, record) =>
        record.status === 'active'
          ? t('vipVehicles.inpatientDaysLeftValue', {
              days: Math.max(getDaysLeft(record.valid_until), 0),
            })
          : '—',
    },
    {
      title: t('vipVehicles.inpatientColumnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getInpatientVehicleStatusTagStyle(record.status, mode)}>
          {t(STATUS_LABEL_KEY[record.status])}
        </Tag>
      ),
    },
    ...(canCancel
      ? [
          {
            title: t('vipVehicles.inpatientColumnActions'),
            key: 'actions',
            render: (_: unknown, record: InpatientVehicle) =>
              record.status === 'active' ? (
                <Popconfirm
                  title={t('vipVehicles.inpatientCancelConfirm')}
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
                    {t('vipVehicles.inpatientCancelButton')}
                  </Button>
                </Popconfirm>
              ) : null,
          },
        ]
      : []),
  ]

  return (
    <Card variant="borderless" styles={{ body: { padding: 0 } }}>
      <Space wrap className="p-4">
        <Select<StatusFilter>
          size="large"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          style={{ width: 180 }}
          options={[
            { value: 'active', label: t('vipVehicles.inpatientStatusActive') },
            { value: 'all', label: t('common.statusAll') },
          ]}
        />
      </Space>

      <Table<InpatientVehicle>
        rowKey="id"
        columns={columns}
        dataSource={vehiclesQuery.data?.vehicles ?? []}
        loading={vehiclesQuery.isLoading}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: vehiclesQuery.data?.pagination.page ?? page,
          pageSize: vehiclesQuery.data?.pagination.limit ?? limit,
          total: vehiclesQuery.data?.pagination.total ?? 0,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage)
            setLimit(nextLimit)
          },
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('vipVehicles.inpatientEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
