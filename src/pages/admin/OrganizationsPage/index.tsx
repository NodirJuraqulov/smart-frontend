import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button, Card, Empty, Form, Input, Select, Space, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  createOrganization,
  getOrganizations,
  toggleOrgBlock,
  updateOrganization,
} from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { useTheme } from '@/contexts/ThemeContext'
import PageHeader from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Organization } from '@/types/organization'
import { buildColumns } from './columns'
import CreateOrganizationModal, {
  type CreateOrganizationFormValues,
} from './CreateOrganizationModal'
import EditOrganizationModal, {
  type EditOrganizationFormValues,
} from './EditOrganizationModal'

type StatusFilter = 'all' | 'active' | 'blocked'

export default function OrganizationsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('organizations.title'))
  const { message } = AntdApp.useApp()
  const { mode } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [createForm] = Form.useForm<CreateOrganizationFormValues>()
  const [editForm] = Form.useForm<EditOrganizationFormValues>()
  const addOperator = Form.useWatch('add_operator', createForm)

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
    refetchInterval: 60000,
  })

  const filteredOrganizations = useMemo(() => {
    const list = organizationsQuery.data ?? []
    const query = searchText.trim().toLowerCase()
    return list.filter((org) => {
      const matchesSearch =
        !query ||
        org.name.toLowerCase().includes(query) ||
        (org.address ?? '').toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && org.is_active) ||
        (statusFilter === 'blocked' && !org.is_active)
      return matchesSearch && matchesStatus
    })
  }, [organizationsQuery.data, searchText, statusFilter])

  useEffect(() => {
    if (editingOrg) {
      editForm.setFieldsValue({
        name: editingOrg.name,
        address: editingOrg.address ?? undefined,
      })
    }
  }, [editingOrg, editForm])

  const invalidateOrganizations = () =>
    queryClient.invalidateQueries({ queryKey: ['organizations'] })

  const createMutation = useMutation({
    mutationFn: (values: CreateOrganizationFormValues) =>
      createOrganization({
        name: values.name,
        address: values.address,
        owner: {
          name: values.owner_name,
          login: values.owner_login,
          password: values.owner_password,
        },
        operator: values.add_operator
          ? {
              name: values.operator_name!,
              login: values.operator_login!,
              password: values.operator_password!,
            }
          : undefined,
        tariff: {
          price_per_hour: values.tariff_price,
          grace_period_minutes: values.tariff_grace_period_minutes,
        },
      }),
    onSuccess: () => {
      invalidateOrganizations()
      setCreateModalOpen(false)
      createForm.resetFields()
      message.success(t('organizations.createSuccess'))
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('organizations.createError'),
          t('organizations.createConflict'),
        ),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => {
      message.success(t('organizations.updateSuccess'))
      invalidateOrganizations()
      setEditingOrg(null)
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('organizations.updateError'),
          t('organizations.updateConflict'),
        ),
      )
    },
  })

  const toggleBlockMutation = useMutation({
    mutationFn: toggleOrgBlock,
    onSuccess: () => {
      invalidateOrganizations()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('organizations.statusChangeError')))
    },
  })

  const columns = buildColumns(t, mode, {
    onEdit: setEditingOrg,
    onViewStats: (record) => navigate(`/admin/organizations/${record.id}`),
    onToggleBlock: (record) =>
      toggleBlockMutation.mutate({ id: record.id, is_active: !record.is_active }),
    isTogglePending: (record) =>
      toggleBlockMutation.isPending &&
      toggleBlockMutation.variables?.id === record.id,
  })

  return (
    <div className="p-6">
      <PageHeader
        title={t('organizations.title')}
        action={
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            {t('organizations.createButton')}
          </Button>
        }
      />

      <Space wrap className="mb-4">
        <Input.Search
          allowClear
          size="large"
          placeholder={t('organizations.searchPlaceholder')}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 280 }}
        />
        <Select<StatusFilter>
          size="large"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: t('common.statusAll') },
            { value: 'active', label: t('common.statusActive') },
            { value: 'blocked', label: t('common.statusBlocked') },
          ]}
        />
      </Space>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<Organization>
          rowKey="id"
          columns={columns}
          dataSource={filteredOrganizations}
          loading={organizationsQuery.isLoading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('organizations.emptyState')}
              />
            ),
          }}
        />
      </Card>

      <CreateOrganizationModal
        open={createModalOpen}
        form={createForm}
        isPending={createMutation.isPending}
        addOperator={!!addOperator}
        onCancel={() => {
          setCreateModalOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditOrganizationModal
        open={!!editingOrg}
        form={editForm}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingOrg(null)}
        onSubmit={(values) =>
          editingOrg && updateMutation.mutate({ id: editingOrg.id, ...values })
        }
      />
    </div>
  )
}
