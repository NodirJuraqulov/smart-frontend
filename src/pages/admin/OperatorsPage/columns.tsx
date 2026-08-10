import { Button, Popconfirm, Space, Tag, type TableProps } from 'antd'
import { EditOutlined, KeyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { getStatusTagStyle } from '@/theme/statusColors'
import type { Operator } from '@/types/user'

export function buildColumns(
  t: (key: string) => string,
  mode: 'light' | 'dark',
  orgNameById: Map<number, string>,
  actions: {
    onEdit: (record: Operator) => void
    onResetPassword: (record: Operator) => void
    onToggleBlock: (record: Operator) => void
    isTogglePending: (record: Operator) => boolean
  },
): TableProps<Operator>['columns'] {
  return [
    {
      title: t('operators.columnName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('operators.columnLogin'),
      dataIndex: 'login',
      key: 'login',
    },
    {
      title: t('operators.columnOrg'),
      key: 'org',
      render: (_, record) =>
        record.org_id ? (orgNameById.get(record.org_id) ?? '—') : '—',
    },
    {
      title: t('operators.columnRole'),
      key: 'role',
      render: (_, record) =>
        t(
          record.role === 'owner'
            ? 'common.roleOwner'
            : record.role === 'kassir'
              ? 'common.roleKassir'
              : 'common.roleOperator',
        ),
    },
    {
      title: t('operators.columnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getStatusTagStyle(record.is_active, mode)}>
          {record.is_active ? t('common.statusActive') : t('common.statusBlocked')}
        </Tag>
      ),
    },
    {
      title: t('operators.columnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => actions.onEdit(record)}>
            {t('operators.editButton')}
          </Button>
          <Button
            icon={<KeyOutlined />}
            onClick={() => actions.onResetPassword(record)}
          >
            {t('operators.resetPasswordButton')}
          </Button>
          <Popconfirm
            title={
              record.is_active
                ? t('operators.blockConfirm')
                : t('operators.unblockConfirm')
            }
            onConfirm={() => actions.onToggleBlock(record)}
          >
            <Button
              danger={record.is_active}
              icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
              loading={actions.isTogglePending(record)}
              disabled={actions.isTogglePending(record)}
            >
              {record.is_active
                ? t('operators.blockButton')
                : t('operators.unblockButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
