import { Card, Empty, Table, type TableProps } from 'antd'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDuration } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import type { ParkingSession } from '@/types/parking'

interface ActiveSessionsTableProps {
  dataSource: ParkingSession[]
  loading: boolean
  now: number
}

export default function ActiveSessionsTable({
  dataSource,
  loading,
  now,
}: ActiveSessionsTableProps) {
  const { t } = useTranslation()

  const columns: TableProps<ParkingSession>['columns'] = [
    {
      title: t('sessions.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('sessions.columnEntered'),
      dataIndex: 'entered_at',
      key: 'entered_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('operatorDashboard.columnElapsed'),
      key: 'elapsed',
      render: (_, record) => {
        const elapsedMinutes = Math.max(
          0,
          Math.floor((now - new Date(record.entered_at).getTime()) / 60000),
        )
        return formatDuration(elapsedMinutes)
      },
    },
  ]

  return (
    <Card
      variant="borderless"
      title={t('operatorDashboard.activeTableTitle')}
      styles={{ body: { padding: 0 } }}
    >
      <Table<ParkingSession>
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
              description={t('sessions.activeEmptyState')}
            />
          ),
        }}
      />
    </Card>
  )
}
