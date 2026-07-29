import { useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Card,
  Col,
  Empty,
  App as AntdApp,
  Row,
  Segmented,
  Skeleton,
  Statistic,
  Table,
  type TableProps,
} from 'antd'
import { getDailyReport } from '@/api/reports'
import { formatMoney } from '@/utils/format'
import SingleSeriesBarChart from '@/components/SingleSeriesBarChart'
import type { HourlyBreakdownItem } from '@/types/reports'
import type { ReportRangeResponse } from '@/types/reports'
import { getErrorMessage } from '@/utils/apiError'
import ReportFilter from './ReportFilter'
import RangeReportView from './RangeReportView'
import { type DateRange, type FilterMode, validateRange } from './reportRange'

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

export default function DailyReportTab() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [mode, setMode] = useState<FilterMode>('single')
  const [range, setRange] = useState<DateRange>(null)
  const [appliedRange, setAppliedRange] = useState<DateRange>(null)
  const [filterError, setFilterError] = useState<string | null>(null)
  const [measure, setMeasure] = useState<'entries' | 'revenue'>('entries')

  const singleQuery = useQuery({
    queryKey: ['reports', 'daily', 'single', date.format('YYYY-MM-DD')],
    queryFn: () => getDailyReport(date.format('YYYY-MM-DD')),
    placeholderData: keepPreviousData,
    enabled: mode === 'single',
  })
  const rangeQuery = useQuery({
    queryKey: ['reports', 'daily', 'range', appliedRange?.[0].format('YYYY-MM-DD'), appliedRange?.[1].format('YYYY-MM-DD')],
    queryFn: () => getDailyReport({
      from_date: appliedRange![0].format('YYYY-MM-DD'),
      to_date: appliedRange![1].format('YYYY-MM-DD'),
    }),
    placeholderData: keepPreviousData,
    enabled: mode === 'range' && Boolean(appliedRange),
  })
  const reportQuery = mode === 'single' ? singleQuery : rangeQuery

  useEffect(() => {
    if (reportQuery.error) {
      message.error(getErrorMessage(reportQuery.error, t('reports.loadError')))
    }
  }, [message, reportQuery.error, t])

  const reset = () => {
    setMode('single')
    setDate(dayjs())
    setRange(null)
    setAppliedRange(null)
    setFilterError(null)
  }

  const applyRange = () => {
    const validation = validateRange('daily', range)
    if (validation || !range) return
    setFilterError(null)
    setAppliedRange(range)
  }

  const columns: TableProps<HourlyBreakdownItem>['columns'] = [
    {
      title: t('reports.hourColumn'),
      dataIndex: 'hour',
      key: 'hour',
      render: formatHour,
    },
    { title: t('reports.entriesColumn'), dataIndex: 'entries', key: 'entries' },
    {
      title: t('reports.revenueColumn'),
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => formatMoney(value),
    },
  ]

  if (reportQuery.isLoading && (mode === 'single' || appliedRange)) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const report = mode === 'single' ? singleQuery.data : undefined

  return (
    <div className="flex flex-col gap-4">
      <ReportFilter
        type="daily"
        mode={mode}
        single={date}
        range={range}
        appliedRange={appliedRange}
        error={filterError}
        onModeChange={(value) => { setMode(value); setFilterError(null) }}
        onSingleChange={setDate}
        onRangeChange={(value) => { setRange(value); setFilterError(null) }}
        onApply={applyRange}
        onReset={reset}
      />

      {mode === 'range' ? (
        appliedRange && <RangeReportView type="daily" report={rangeQuery.data as ReportRangeResponse | undefined} />
      ) : (
      <>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={8} lg={4}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.totalEntries')}
              value={report?.total_entries ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.totalExits')}
              value={report?.total_exits ?? 0}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.totalRevenue')}
              value={report?.total_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.cashRevenue')}
              value={report?.cash_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={5}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.onlineRevenue')}
              value={report?.online_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={12} md={8} lg={4}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.currentlyParked')}
              value={report?.currently_parked ?? 0}
            />
          </Card>
        </Col>
        <Col xs={24} md={8} lg={4}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.busiestHour')}
              value={
                report?.busiest_hour != null
                  ? formatHour(report.busiest_hour)
                  : '—'
              }
            />
          </Card>
        </Col>
      </Row>

      <Segmented
        value={measure}
        onChange={(value) => setMeasure(value as 'entries' | 'revenue')}
        options={[
          { label: t('reports.measureEntries'), value: 'entries' },
          { label: t('reports.measureRevenue'), value: 'revenue' },
        ]}
      />

      <Card variant="borderless">
        <SingleSeriesBarChart<HourlyBreakdownItem>
          data={report?.hourly_breakdown ?? []}
          xKey="hour"
          yKey={measure}
          xTickFormatter={(value) => String(value)}
          xInterval={1}
          yTickFormatter={
            measure === 'revenue'
              ? (value) => value.toLocaleString('uz-UZ')
              : undefined
          }
          tooltipFormatter={measure === 'revenue' ? formatMoney : undefined}
        />
      </Card>

      <Card
        variant="borderless"
        title={t('reports.tableViewTitle')}
        styles={{ body: { padding: 0 } }}
      >
        <Table<HourlyBreakdownItem>
          rowKey="hour"
          columns={columns}
          dataSource={report?.hourly_breakdown ?? []}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('reports.emptyState')}
              />
            ),
          }}
        />
      </Card>
      </>
      )}
    </div>
  )
}
