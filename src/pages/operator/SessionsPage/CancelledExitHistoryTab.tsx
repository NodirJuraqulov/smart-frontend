import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Empty,
  Table,
  type TableProps,
} from 'antd'
import { getCancelledExitCandidates } from '@/api/exitCandidates'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PlateBadge from '@/components/PlateBadge'
import { formatDate } from '@/utils/format'
import type { CancelledExitHistoryItem } from '@/types/exitCandidate'

const DEFAULT_PAGE_SIZE = 20
const MAX_RANGE_DAYS = 31

type DateRange = [Dayjs, Dayjs]

export default function CancelledExitHistoryTab() {
  const { t } = useTranslation()
  const today = dayjs().startOf('day')
  const [range, setRange] = useState<DateRange>([today, today])
  const [appliedRange, setAppliedRange] = useState<DateRange>([today, today])
  const [rangeError, setRangeError] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE)

  const historyQuery = useQuery({
    queryKey: [
      'cancelled-exit-history',
      appliedRange[0].format('YYYY-MM-DD'),
      appliedRange[1].format('YYYY-MM-DD'),
      page,
      limit,
    ],
    queryFn: () =>
      getCancelledExitCandidates({
        from: appliedRange[0].format('YYYY-MM-DD'),
        to: appliedRange[1].format('YYYY-MM-DD'),
        page,
        limit,
      }),
  })

  const columns: TableProps<CancelledExitHistoryItem>['columns'] = [
    {
      title: t('sessions.cancelledExitColumnTime'),
      dataIndex: 'camera_event_at',
      key: 'camera_event_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('sessions.columnPlate'),
      dataIndex: 'detected_plate',
      key: 'detected_plate',
      render: (value: string | null) =>
        value ? <PlateBadge value={value} /> : '-',
    },
    {
      title: t('sessions.cancelledExitColumnConfidence'),
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value: number) => `${value}%`,
    },
    {
      title: t('sessions.cancelledExitColumnResolver'),
      dataIndex: 'resolved_by',
      key: 'resolved_by',
      render: (value: CancelledExitHistoryItem['resolved_by']) =>
        value?.name || '-',
    },
    {
      title: t('sessions.cancelledExitColumnImage'),
      dataIndex: 'image_url',
      key: 'image_url',
      render: (value: string | null, record) =>
        record.has_image && value ? (
          <AuthenticatedImage
            url={value}
            alt={t('sessions.cancelledExitImageAlt', {
              plate: record.detected_plate || '-',
            })}
            style={{ width: 96, height: 64, objectFit: 'cover' }}
          />
        ) : (
          '-'
        ),
    },
  ]

  const handleRangeChange = (values: DateRange | null) => {
    if (!values) return
    setRange(values)
    const rangeDays =
      values[1].startOf('day').diff(values[0].startOf('day'), 'day') + 1
    if (rangeDays < 1 || rangeDays > MAX_RANGE_DAYS) {
      setRangeError(true)
      return
    }
    setRangeError(false)
    setPage(1)
    setAppliedRange(values)
  }

  return (
    <div className="flex flex-col gap-4">
      <DatePicker.RangePicker
        value={range}
        onChange={(values) => handleRangeChange(values as DateRange | null)}
        disabledDate={(current) =>
          current.startOf('day').isAfter(dayjs().startOf('day'))
        }
        format="YYYY-MM-DD"
        placeholder={[
          t('sessions.cancelledExitStartDate'),
          t('sessions.cancelledExitEndDate'),
        ]}
        allowClear={false}
        aria-label={t('sessions.cancelledExitRange')}
      />

      {rangeError && (
        <Alert
          type="error"
          showIcon
          title={t('sessions.cancelledExitRangeLimit')}
        />
      )}

      {historyQuery.isError && (
        <Alert
          type="error"
          showIcon
          title={t('sessions.cancelledExitLoadError')}
          action={
            <Button size="small" onClick={() => historyQuery.refetch()}>
              {t('sessions.cancelledExitRetry')}
            </Button>
          }
        />
      )}

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Table<CancelledExitHistoryItem>
          rowKey="id"
          columns={columns}
          dataSource={historyQuery.data?.history ?? []}
          loading={historyQuery.isLoading || historyQuery.isFetching}
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
                description={t('sessions.cancelledExitEmptyState')}
              />
            ),
          }}
        />
      </Card>
    </div>
  )
}
