import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { Dayjs } from 'dayjs'
import { Card, DatePicker, Empty, Input, Select, Space, Table } from 'antd'
import { getSessions } from '@/api/parking'
import { useTheme } from '@/contexts/ThemeContext'
import { useAppSelector } from '@/hooks/redux'
import ReceiptModal from '@/components/ReceiptModal'
import type { ParkingSession, SessionStatus } from '@/types/parking'
import { useSharedImagePreview } from './useSharedImagePreview'
import { buildColumns } from './columns'

type StatusFilter = 'all' | SessionStatus

export default function HistorySessionsTab() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { setPreviewSrc, previewElement } = useSharedImagePreview()
  const orgName = useAppSelector((state) => state.auth.user?.org_name)

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [plateSearch, setPlateSearch] = useState('')
  const [date, setDate] = useState<Dayjs | null>(null)
  const [receiptSession, setReceiptSession] = useState<ParkingSession | null>(
    null,
  )

  const historyQuery = useQuery({
    queryKey: [
      'parking',
      'sessions',
      { page, limit, statusFilter, plateSearch, date: date?.format('YYYY-MM-DD') },
    ],
    queryFn: () =>
      getSessions({
        page,
        limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        plate_number: plateSearch || undefined,
        date: date ? date.format('YYYY-MM-DD') : undefined,
      }),
  })

  const columns = buildColumns(t, mode, setPreviewSrc, {
    onReceipt: setReceiptSession,
  })

  return (
    <>
      <Space wrap className="mb-4">
        <Input.Search
          allowClear
          size="large"
          placeholder={t('sessions.searchPlaceholder')}
          onChange={(e) => {
            setPlateSearch(e.target.value)
            setPage(1)
          }}
          style={{ width: 240 }}
        />
        <DatePicker
          size="large"
          placeholder={t('sessions.datePlaceholder')}
          value={date}
          onChange={(value) => {
            setDate(value)
            setPage(1)
          }}
        />
        <Select<StatusFilter>
          size="large"
          value={statusFilter}
          onChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
          style={{ width: 180 }}
          options={[
            { value: 'all', label: t('common.statusAll') },
            { value: 'active', label: t('sessions.statusActive') },
            { value: 'completed', label: t('sessions.statusCompleted') },
          ]}
        />
      </Space>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        {previewElement}
        <Table<ParkingSession>
          rowKey="id"
          columns={columns}
          dataSource={historyQuery.data?.sessions ?? []}
          loading={historyQuery.isLoading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: historyQuery.data?.pagination.page ?? page,
            pageSize: historyQuery.data?.pagination.limit ?? limit,
            total: historyQuery.data?.pagination.total ?? 0,
            onChange: (nextPage, nextLimit) => {
              setPage(nextPage)
              setLimit(nextLimit)
            },
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('sessions.historyEmptyState')}
              />
            ),
          }}
        />
      </Card>

      <ReceiptModal
        open={!!receiptSession}
        onClose={() => setReceiptSession(null)}
        session={receiptSession}
        amount={receiptSession?.amount ?? null}
        paymentMethod={null}
        orgName={orgName}
      />
    </>
  )
}
