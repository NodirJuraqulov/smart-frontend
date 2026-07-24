import { Button, Card, Empty, Popconfirm, Space, Table, Tag, type TableProps } from 'antd'
import {
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import type { Operator } from '@/types/user'

interface OperatorsCardProps {
  dataSource: Operator[]
  loading: boolean
  showAddOperatorButton: boolean
  onAddOperator: () => void
  onResetPassword: (record: Operator) => void
  onToggleBlock: (record: Operator) => void
  isTogglePending: (record: Operator) => boolean
}

export default function OperatorsCard({
  dataSource,
  loading,
  showAddOperatorButton,
  onAddOperator,
  onResetPassword,
  onToggleBlock,
  isTogglePending,
}: OperatorsCardProps) {
  const { t } = useTranslation()
  const { mode } = useTheme()

  const columns: TableProps<Operator>['columns'] = [
    { title: t('operators.columnName'), dataIndex: 'name', key: 'name' },
    { title: t('operators.columnLogin'), dataIndex: 'login', key: 'login' },
    {
      title: t('orgDetail.operatorColumnRole'),
      key: 'role',
      render: (_, record) => (
        <Tag>
          {record.role === 'owner'
            ? t('orgDetail.roleOwner')
            : t('orgDetail.roleOperator')}
        </Tag>
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
        <Space wrap>
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => onResetPassword(record)}
          >
            {t('operators.resetPasswordButton')}
          </Button>
          <Popconfirm
            title={
              record.is_active
                ? t('operators.blockConfirm')
                : t('operators.unblockConfirm')
            }
            onConfirm={() => onToggleBlock(record)}
          >
            <Button
              size="small"
              danger={record.is_active}
              icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
              loading={isTogglePending(record)}
              disabled={isTogglePending(record)}
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

  return (
    <Card
      variant="borderless"
      title={t('orgDetail.operatorsTitle')}
      extra={
        showAddOperatorButton && (
          <Button icon={<PlusOutlined />} onClick={onAddOperator}>
            {t('orgDetail.addOperatorButton')}
          </Button>
        )
      }
      styles={{ body: { padding: 0 } }}
    >
      <Table<Operator>
        rowKey="id"
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('orgDetail.operatorsEmpty')}
            />
          ),
        }}
      />
    </Card>
  )
}
