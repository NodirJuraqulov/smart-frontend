import { Button, Popconfirm, Space, Tag, type TableProps } from 'antd'
import {
  BarChartOutlined,
  EditOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { getStatusTagStyle } from '@/theme/statusColors'
import type { Organization } from '@/types/organization'

export function buildColumns(
  t: (key: string) => string,
  mode: 'light' | 'dark',
  actions: {
    onEdit: (record: Organization) => void
    onViewStats: (record: Organization) => void
    onToggleBlock: (record: Organization) => void
    isTogglePending: (record: Organization) => boolean
  },
): TableProps<Organization>['columns'] {
  return [
    {
      title: t('organizations.columnName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('organizations.columnAddress'),
      dataIndex: 'address',
      key: 'address',
      render: (address: string | null) => address || '—',
    },
    {
      title: t('organizations.columnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getStatusTagStyle(record.is_active, mode)}>
          {record.is_active ? t('common.statusActive') : t('common.statusBlocked')}
        </Tag>
      ),
    },
    {
      title: t('organizations.columnConnection'),
      key: 'connection',
      render: (_, record) => (
        <Tag style={getStatusTagStyle(record.is_online, mode)}>
          {record.is_online
            ? `🟢 ${t('organizations.online')}`
            : `🔴 ${t('organizations.offline')}`}
        </Tag>
      ),
    },
    {
      title: t('organizations.columnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => actions.onEdit(record)}>
            {t('organizations.editButton')}
          </Button>
          <Button
            icon={<BarChartOutlined />}
            onClick={() => actions.onViewStats(record)}
          >
            {t('organizations.statsButton')}
          </Button>
          <Popconfirm
            title={
              record.is_active
                ? t('organizations.blockConfirm')
                : t('organizations.unblockConfirm')
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
                ? t('organizations.blockButton')
                : t('organizations.unblockButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]
}
