import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button, Card, Empty, Form, Input, Select, Space, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  createOperator,
  getOperators,
  resetPassword,
  toggleBlock,
  updateOperator,
} from '@/api/users'
import { getOrganizations } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { useTheme } from '@/contexts/ThemeContext'
import PageHeader from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import type { Operator } from '@/types/user'
import { buildColumns } from './columns'
import CreateOperatorModal, {
  type CreateOperatorFormValues,
} from './CreateOperatorModal'
import EditOperatorModal, { type EditOperatorFormValues } from './EditOperatorModal'
import ResetPasswordModal, {
  type ResetPasswordFormValues,
} from './ResetPasswordModal'

type StatusFilter = 'all' | 'active' | 'blocked'

export default function OperatorsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('operators.title'))
  const { message } = AntdApp.useApp()
  const { mode } = useTheme()
  const queryClient = useQueryClient()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null)
  const [resetPasswordOperator, setResetPasswordOperator] =
    useState<Operator | null>(null)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const [createForm] = Form.useForm<CreateOperatorFormValues>()
  const [editForm] = Form.useForm<EditOperatorFormValues>()
  const [resetPasswordForm] = Form.useForm<ResetPasswordFormValues>()

  const operatorsQuery = useQuery({
    queryKey: ['operators'],
    queryFn: getOperators,
  })

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const orgNameById = useMemo(() => {
    const map = new Map<number, string>()
    for (const org of organizationsQuery.data ?? []) {
      map.set(org.id, org.name)
    }
    return map
  }, [organizationsQuery.data])

  const orgOptions = useMemo(
    () =>
      (organizationsQuery.data ?? []).map((org) => ({
        label: org.name,
        value: org.id,
      })),
    [organizationsQuery.data],
  )

  const filteredOperators = useMemo(() => {
    const list = operatorsQuery.data ?? []
    const query = searchText.trim().toLowerCase()
    return list.filter((operator) => {
      const matchesSearch =
        !query ||
        operator.name.toLowerCase().includes(query) ||
        operator.login.toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && operator.is_active) ||
        (statusFilter === 'blocked' && !operator.is_active)
      return matchesSearch && matchesStatus
    })
  }, [operatorsQuery.data, searchText, statusFilter])

  useEffect(() => {
    if (editingOperator) {
      editForm.setFieldsValue({
        name: editingOperator.name,
        login: editingOperator.login,
        org_id: editingOperator.org_id ?? undefined,
      })
    }
  }, [editingOperator, editForm])

  const invalidateOperators = () =>
    queryClient.invalidateQueries({ queryKey: ['operators'] })

  const createMutation = useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      message.success(t('operators.createSuccess'))
      invalidateOperators()
      setCreateModalOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('operators.createError'),
          t('operators.loginConflict'),
        ),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateOperator,
    onSuccess: () => {
      message.success(t('operators.updateSuccess'))
      invalidateOperators()
      setEditingOperator(null)
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('operators.updateError'),
          t('operators.loginConflict'),
        ),
      )
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      message.success(t('operators.resetPasswordSuccess'))
      setResetPasswordOperator(null)
      resetPasswordForm.resetFields()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operators.resetPasswordError')))
    },
  })

  const toggleBlockMutation = useMutation({
    mutationFn: toggleBlock,
    onSuccess: () => {
      invalidateOperators()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operators.statusChangeError')))
    },
  })

  const columns = buildColumns(t, mode, orgNameById, {
    onEdit: setEditingOperator,
    onResetPassword: setResetPasswordOperator,
    onToggleBlock: (record) =>
      toggleBlockMutation.mutate({ id: record.id, is_active: !record.is_active }),
    isTogglePending: (record) =>
      toggleBlockMutation.isPending &&
      toggleBlockMutation.variables?.id === record.id,
  })

  return (
    <div className="p-6">
      <PageHeader
        title={t('operators.title')}
        action={
          <Button
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            {t('operators.createButton')}
          </Button>
        }
      />

      <Space wrap className="mb-4">
        <Input.Search
          allowClear
          size="large"
          placeholder={t('operators.searchPlaceholder')}
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
        <Table<Operator>
          rowKey="id"
          columns={columns}
          dataSource={filteredOperators}
          loading={operatorsQuery.isLoading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('operators.emptyState')}
              />
            ),
          }}
        />
      </Card>

      <CreateOperatorModal
        open={createModalOpen}
        form={createForm}
        orgOptions={orgOptions}
        orgsLoading={organizationsQuery.isLoading}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateModalOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditOperatorModal
        open={!!editingOperator}
        form={editForm}
        orgOptions={orgOptions}
        orgsLoading={organizationsQuery.isLoading}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingOperator(null)}
        onSubmit={(values) =>
          editingOperator &&
          updateMutation.mutate({ id: editingOperator.id, ...values })
        }
      />

      <ResetPasswordModal
        open={!!resetPasswordOperator}
        form={resetPasswordForm}
        isPending={resetPasswordMutation.isPending}
        onCancel={() => {
          setResetPasswordOperator(null)
          resetPasswordForm.resetFields()
        }}
        onSubmit={(values) =>
          resetPasswordOperator &&
          resetPasswordMutation.mutate({
            id: resetPasswordOperator.id,
            password: values.password,
          })
        }
      />
    </div>
  )
}
