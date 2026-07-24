import { Button, type TableProps } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { formatDate } from '@/utils/format'
import type { ActivityLog } from '@/types/activityLog'
import { getActionLabel, getTargetTypeLabel } from './actionLabels'

export function buildColumns(
  t: (key: string) => string,
  onViewDetails: (record: ActivityLog) => void,
): TableProps<ActivityLog>['columns'] {
  return [
    {
      title: t('activityLog.columnTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('activityLog.columnActor'),
      dataIndex: 'actor_name',
      key: 'actor_name',
    },
    {
      title: t('activityLog.columnAction'),
      key: 'action',
      render: (_, record) => getActionLabel(t, record.action),
    },
    {
      title: t('activityLog.columnTargetType'),
      dataIndex: 'target_type',
      key: 'target_type',
      render: (value: string) => (value ? getTargetTypeLabel(t, value) : '—'),
    },
    {
      title: t('activityLog.columnDetails'),
      key: 'details',
      render: (_, record) =>
        record.details ? (
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onViewDetails(record)}
          >
            {t('activityLog.viewDetailsButton')}
          </Button>
        ) : (
          '—'
        ),
    },
  ]
}
