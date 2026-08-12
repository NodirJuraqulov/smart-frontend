import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Empty,
  Form,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  type TableProps,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  createPlateFormat,
  deletePlateFormat,
  getPlateFormats,
  getPlateFormatValidationSetting,
  updatePlateFormat,
  updatePlateFormatValidationSetting,
} from '@/api/plateFormats'
import { getOrganizations } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import PageHeader from '@/components/PageHeader'
import type { PlateFormat } from '@/types/plateFormat'
import FormatFormModal, {
  type PlateFormatFormValues,
} from './FormatFormModal'

export default function PlateFormatsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('plateFormats.title'))
  const { message } = AntdApp.useApp()
  const { mode } = useTheme()
  const queryClient = useQueryClient()

  const [orgId, setOrgId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingFormat, setEditingFormat] = useState<PlateFormat | null>(null)
  const [createForm] = Form.useForm<PlateFormatFormValues>()
  const [editForm] = Form.useForm<PlateFormatFormValues>()

  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  useEffect(() => {
    const organizations = organizationsQuery.data
    if (orgId === null && organizations?.length) {
      setOrgId(organizations[0].id)
    }
  }, [orgId, organizationsQuery.data])

  const orgOptions = useMemo(
    () =>
      (organizationsQuery.data ?? []).map((organization) => ({
        label: organization.name,
        value: organization.id,
      })),
    [organizationsQuery.data],
  )

  const settingQueryKey = ['plate-format-setting', orgId]
  const formatsQueryKey = ['plate-formats', orgId]

  const settingQuery = useQuery({
    queryKey: settingQueryKey,
    queryFn: () => getPlateFormatValidationSetting(orgId!),
    enabled: orgId != null,
    retry: false,
  })

  const formatsQuery = useQuery({
    queryKey: formatsQueryKey,
    queryFn: () => getPlateFormats(orgId!),
    enabled: orgId != null,
    retry: false,
  })

  const invalidateFormats = () =>
    queryClient.invalidateQueries({ queryKey: formatsQueryKey })

  const settingMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updatePlateFormatValidationSetting({ orgId: orgId!, enabled }),
    onSuccess: (setting) => {
      queryClient.setQueryData(settingQueryKey, setting)
      message.success(t('plateFormats.settingSaveSuccess'))
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('plateFormats.settingSaveError')))
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: PlateFormatFormValues) =>
      createPlateFormat({
        orgId: orgId!,
        pattern: values.pattern.trim().toUpperCase(),
        description: values.description?.trim() || undefined,
      }),
    onSuccess: () => {
      message.success(t('plateFormats.createSuccess'))
      setCreateOpen(false)
      createForm.resetFields()
      invalidateFormats()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('plateFormats.createError'),
          t('plateFormats.duplicateError'),
        ),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      formatId,
      ...payload
    }: {
      formatId: number
      pattern?: string
      description?: string | null
      is_active?: boolean
    }) => updatePlateFormat({ orgId: orgId!, formatId, ...payload }),
    onSuccess: () => {
      message.success(t('plateFormats.updateSuccess'))
      setEditingFormat(null)
      invalidateFormats()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('plateFormats.updateError'),
          t('plateFormats.duplicateError'),
        ),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (formatId: number) =>
      deletePlateFormat({ orgId: orgId!, formatId }),
    onSuccess: () => {
      message.success(t('plateFormats.deleteSuccess'))
      invalidateFormats()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('plateFormats.deleteError')))
    },
  })

  useEffect(() => {
    if (editingFormat) {
      editForm.setFieldsValue({
        pattern: editingFormat.pattern,
        description: editingFormat.description ?? undefined,
      })
    }
  }, [editingFormat, editForm])

  const columns: TableProps<PlateFormat>['columns'] = [
    {
      title: t('plateFormats.columnPattern'),
      key: 'pattern',
      render: (_, record) => (
        <Typography.Text code>{record.pattern}</Typography.Text>
      ),
    },
    {
      title: t('plateFormats.columnDescription'),
      key: 'description',
      render: (_, record) => record.description || '—',
    },
    {
      title: t('plateFormats.columnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getStatusTagStyle(record.is_active, mode)}>
          {record.is_active
            ? t('plateFormats.statusActive')
            : t('plateFormats.statusInactive')}
        </Tag>
      ),
    },
    {
      title: t('plateFormats.columnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Switch
            checked={record.is_active}
            aria-label={t('plateFormats.toggleActiveAria', {
              pattern: record.pattern,
            })}
            disabled={updateMutation.isPending}
            onChange={(checked) =>
              updateMutation.mutate({
                formatId: record.id,
                is_active: checked,
              })
            }
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => setEditingFormat(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('plateFormats.deleteConfirm')}
            okText={t('plateFormats.deleteConfirmOk')}
            cancelText={t('common.cancel')}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t('plateFormats.deleteButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <PageHeader
        title={t('plateFormats.title')}
        action={
          <Button
            icon={<PlusOutlined />}
            disabled={orgId == null}
            onClick={() => setCreateOpen(true)}
          >
            {t('plateFormats.createButton')}
          </Button>
        }
      />

      <Space wrap className="mb-4">
        <Select<number>
          size="large"
          style={{ width: 280 }}
          value={orgId ?? undefined}
          onChange={setOrgId}
          loading={organizationsQuery.isLoading}
          options={orgOptions}
          placeholder={t('plateFormats.organizationPlaceholder')}
          aria-label={t('plateFormats.organizationLabel')}
        />
      </Space>

      <Card variant="borderless" className="mb-4">
        {settingQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <Space>
            <Switch
              checked={settingQuery.data?.enabled ?? false}
              loading={settingMutation.isPending}
              disabled={
                orgId == null ||
                settingMutation.isPending ||
                settingQuery.isError
              }
              onChange={(checked) => settingMutation.mutate(checked)}
            />
            <Typography.Text>{t('plateFormats.settingLabel')}</Typography.Text>
          </Space>
        )}
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<PlateFormat>
          rowKey="id"
          columns={columns}
          dataSource={formatsQuery.data ?? []}
          loading={formatsQuery.isLoading}
          scroll={{ x: 'max-content' }}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('plateFormats.emptyState')}
              />
            ),
          }}
        />
      </Card>

      <FormatFormModal
        open={createOpen}
        title={t('plateFormats.createModalTitle')}
        okText={t('common.create')}
        form={createForm}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <FormatFormModal
        open={!!editingFormat}
        title={t('plateFormats.editModalTitle')}
        okText={t('common.save')}
        form={editForm}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingFormat(null)}
        onSubmit={(values) =>
          editingFormat &&
          updateMutation.mutate({
            formatId: editingFormat.id,
            pattern: values.pattern.trim().toUpperCase(),
            description: values.description?.trim() || null,
          })
        }
      />
    </div>
  )
}
