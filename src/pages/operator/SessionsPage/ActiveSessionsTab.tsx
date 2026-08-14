import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Table } from 'antd'
import { getActiveSessions } from '@/api/parking'
import { useTheme } from '@/contexts/ThemeContext'
import type { ParkingSession } from '@/types/parking'
import { buildColumns } from './columns'
import ForceCloseModal from './ForceCloseModal'

export default function ActiveSessionsTab() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const [forceCloseTarget, setForceCloseTarget] = useState<ParkingSession | null>(
    null,
  )

  const activeQuery = useQuery({
    queryKey: ['parking', 'active'],
    queryFn: getActiveSessions,
    refetchInterval: 10000,
  })

  const columns = buildColumns(t, mode, {
    onForceClose: setForceCloseTarget,
  })

  return (
    <>
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<ParkingSession>
          rowKey="id"
          columns={columns}
          dataSource={activeQuery.data ?? []}
          loading={activeQuery.isLoading}
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

      <ForceCloseModal
        session={forceCloseTarget}
        onClose={() => setForceCloseTarget(null)}
      />
    </>
  )
}
