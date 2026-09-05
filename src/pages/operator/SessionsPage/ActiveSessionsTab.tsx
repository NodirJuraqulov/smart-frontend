import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Input, Space, Table } from 'antd'
import { getSessions } from '@/api/parking'
import { useTheme } from '@/contexts/ThemeContext'
import { useAppSelector } from '@/hooks/redux'
import { useCardPayments } from '@/hooks/useCardPayments'
import type { ParkingSession } from '@/types/parking'
import { buildColumns } from './columns'
import ForceCloseModal from './ForceCloseModal'

const REGISTRATOR_COLUMN_KEYS = new Set([
  'plate_number',
  'entered_at',
  'images',
])

export default function ActiveSessionsTab() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { isCardPending } = useCardPayments()
  const isRegistrator = useAppSelector(
    (state) => state.auth.user?.role === 'registrator',
  )
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [plateSearch, setPlateSearch] = useState('')
  const [forceCloseTarget, setForceCloseTarget] = useState<ParkingSession | null>(
    null,
  )

  const activeQuery = useQuery({
    queryKey: ['parking', 'sessions', 'active', { page, limit, plateSearch }],
    queryFn: () =>
      getSessions({
        page,
        limit,
        status: 'active',
        plate_number: plateSearch.trim() || undefined,
      }),
    refetchInterval: 10000,
  })

  const columns = buildColumns(
    t,
    mode,
    isRegistrator
      ? undefined
      : { onForceClose: setForceCloseTarget, isCardPending },
  )?.filter(
    (column) =>
      !isRegistrator || REGISTRATOR_COLUMN_KEYS.has(String(column.key)),
  )

  return (
    <>
      <Space wrap className="mb-4">
        <Input.Search
          allowClear
          size="large"
          placeholder={t('sessions.searchPlaceholder')}
          onChange={(event) => {
            setPlateSearch(event.target.value)
            setPage(1)
          }}
          style={{ width: 240 }}
        />
      </Space>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<ParkingSession>
          rowKey="id"
          columns={columns}
          dataSource={activeQuery.data?.sessions ?? []}
          loading={activeQuery.isLoading}
          pagination={{
            current: activeQuery.data?.pagination.page ?? page,
            pageSize: activeQuery.data?.pagination.limit ?? limit,
            total: activeQuery.data?.pagination.total ?? 0,
            onChange: (nextPage, nextLimit) => {
              setPage(nextPage)
              setLimit(nextLimit)
            },
          }}
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

      {!isRegistrator && (
        <ForceCloseModal
          session={forceCloseTarget}
          onClose={() => setForceCloseTarget(null)}
        />
      )}
    </>
  )
}
