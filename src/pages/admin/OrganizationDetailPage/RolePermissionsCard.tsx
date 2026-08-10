import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Checkbox,
  Form,
  Skeleton,
  Space,
  Tag,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { getPermissions, updatePermissions } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import type { OperatorPermissions, PermissionRole } from '@/types/permissions'

interface RolePermissionsCardProps {
  orgId: number
  role: PermissionRole
}

const PERMISSION_FIELDS: {
  key: keyof OperatorPermissions
  labelKey: string
}[] = [
  { key: 'can_view_dashboard', labelKey: 'permissions.dashboard' },
  { key: 'can_view_sessions', labelKey: 'permissions.sessions' },
  { key: 'can_view_reports', labelKey: 'permissions.reports' },
  { key: 'can_view_tariffs', labelKey: 'permissions.tariffs' },
  { key: 'can_view_subscriptions', labelKey: 'permissions.subscriptions' },
  { key: 'can_view_settings', labelKey: 'permissions.settings' },
  { key: 'can_view_activity_log', labelKey: 'permissions.activityLog' },
]

const ROLE_TITLE_KEY: Record<PermissionRole, string> = {
  operator: 'permissions.operatorTitle',
  kassir: 'permissions.kassirTitle',
}

const ROLE_LABEL_KEY: Record<PermissionRole, string> = {
  operator: 'common.roleOperator',
  kassir: 'common.roleKassir',
}

export default function RolePermissionsCard({
  orgId,
  role,
}: RolePermissionsCardProps) {
  const { t } = useTranslation()
  const { message, modal } = AntdApp.useApp()
  const { mode } = useTheme()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<OperatorPermissions>()
  const hasSyncedRef = useRef(false)
  const [isEditing, setIsEditing] = useState(false)

  const permissionsQuery = useQuery({
    queryKey: ['permissions', orgId, role],
    queryFn: () => getPermissions(orgId, role),
  })

  useEffect(() => {
    if (permissionsQuery.data && !hasSyncedRef.current) {
      form.setFieldsValue(permissionsQuery.data)
      hasSyncedRef.current = true
    }
  }, [permissionsQuery.data, form])

  const mutation = useMutation({
    mutationFn: (permissions: OperatorPermissions) =>
      updatePermissions({ id: orgId, role, permissions }),
    onSuccess: () => {
      message.success(t('permissions.updateSuccess'))
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['permissions', orgId, role] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('permissions.updateError')))
    },
  })

  const handleEdit = () => {
    if (permissionsQuery.data) {
      form.setFieldsValue(permissionsQuery.data)
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (permissionsQuery.data) {
      form.setFieldsValue(permissionsQuery.data)
    }
    setIsEditing(false)
  }

  const handleFinish = (values: OperatorPermissions) => {
    const hasVisibleSection = PERMISSION_FIELDS.some(
      (field) => values[field.key],
    )
    if (hasVisibleSection) {
      mutation.mutate(values)
      return
    }

    modal.confirm({
      title: t('permissions.emptyWarningTitle'),
      content: t('permissions.emptyWarningContent', {
        role: t(ROLE_LABEL_KEY[role]),
      }),
      okText: t('permissions.emptyWarningConfirm'),
      cancelText: t('common.cancel'),
      onOk: () => mutation.mutate(values),
    })
  }

  return (
    <Card
      variant="borderless"
      title={t(ROLE_TITLE_KEY[role])}
      data-testid={`permissions-card-${role}`}
      className="h-full"
    >
      {permissionsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : isEditing ? (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <div className="mb-4 flex flex-col gap-2">
            {PERMISSION_FIELDS.map((field) => (
              <Form.Item
                key={field.key}
                name={field.key}
                valuePropName="checked"
                className="mb-0"
              >
                <Checkbox>{t(field.labelKey)}</Checkbox>
              </Form.Item>
            ))}
          </div>
          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={mutation.isPending}
                disabled={mutation.isPending}
              >
                {t('common.save')}
              </Button>
              <Button onClick={handleCancel} disabled={mutation.isPending}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <div className="flex flex-col gap-2">
            {PERMISSION_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-3">
                <span>{t(field.labelKey)}</span>
                <Tag
                  style={getStatusTagStyle(
                    !!permissionsQuery.data?.[field.key],
                    mode,
                  )}
                >
                  {permissionsQuery.data?.[field.key]
                    ? t('permissions.visible')
                    : t('permissions.hidden')}
                </Tag>
              </div>
            ))}
          </div>
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            {t('permissions.editButton')}
          </Button>
        </div>
      )}
    </Card>
  )
}
