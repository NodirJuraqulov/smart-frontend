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
import { getYearlyReport } from '@/api/reports'
import { formatMoney } from '@/utils/format'
import SingleSeriesBarChart from '@/components/SingleSeriesBarChart'
import type { MonthlyBreakdownItem } from '@/types/reports'
import type { ReportRangeResponse } from '@/types/reports'
import { getErrorMessage } from '@/utils/apiError'
import ReportFilter from './ReportFilter'
import RangeReportView from './RangeReportView'
import { type DateRange, type FilterMode, validateRange } from './reportRange'

export default function YearlyReportTab() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const [year, setYear] = useState<Dayjs>(dayjs())
  const [mode, setMode] = useState<FilterMode>('single')
  const [range, setRange] = useState<DateRange>(null)
  const [appliedRange, setAppliedRange] = useState<DateRange>(null)
  const [measure, setMeasure] = useState<'entries' | 'exits' | 'revenue'>(
    'entries',
  )

  const singleQuery = useQuery({
    queryKey: ['reports', 'yearly', 'single', year.year()],
    queryFn: () => getYearlyReport(year.year()),
    placeholderData: keepPreviousData,
    enabled: mode === 'single',
  })
  const rangeQuery = useQuery({
    queryKey: ['reports', 'yearly', 'range', appliedRange?.[0].year(), appliedRange?.[1].year()],
    queryFn: () => getYearlyReport({
      from_year: appliedRange![0].year(),
      to_year: appliedRange![1].year(),
    }),
    placeholderData: keepPreviousData,
    enabled: mode === 'range' && Boolean(appliedRange),
  })
  const reportQuery = mode === 'single' ? singleQuery : rangeQuery
  useEffect(() => {
    if (reportQuery.error) message.error(getErrorMessage(reportQuery.error, t('reports.loadError')))
  }, [message, reportQuery.error, t])
  const reset = () => { setMode('single'); setYear(dayjs()); setRange(null); setAppliedRange(null) }
  const applyRange = () => {
    if (!validateRange('yearly', range) && range) setAppliedRange(range)
  }

  const columns: TableProps<MonthlyBreakdownItem>['columns'] = [
    { title: t('reports.monthColumn'), dataIndex: 'month', key: 'month' },
    { title: t('reports.entriesColumn'), dataIndex: 'entries', key: 'entries' },
    { title: t('reports.exitsColumn'), dataIndex: 'exits', key: 'exits' },
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
      <ReportFilter type="yearly" mode={mode} single={year} range={range} appliedRange={appliedRange} error={null}
        onModeChange={setMode} onSingleChange={setYear} onRangeChange={setRange} onApply={applyRange} onReset={reset} />

      {mode === 'range' ? (
        appliedRange && <RangeReportView type="yearly" report={rangeQuery.data as ReportRangeResponse | undefined} />
      ) : (
      <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.totalEntries')}
              value={report?.total_entries ?? 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.totalExits')}
              value={report?.total_exits ?? 0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.totalRevenue')}
              value={report?.total_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.cashRevenue')}
              value={report?.cash_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card variant="borderless">
            <Statistic
              title={t('reports.onlineRevenue')}
              value={report?.online_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      <Segmented
        value={measure}
        onChange={(value) =>
          setMeasure(value as 'entries' | 'exits' | 'revenue')
        }
        options={[
          { label: t('reports.measureEntries'), value: 'entries' },
          { label: t('reports.measureExits'), value: 'exits' },
          { label: t('reports.measureRevenue'), value: 'revenue' },
        ]}
      />

      <Card variant="borderless">
        <SingleSeriesBarChart<MonthlyBreakdownItem>
          data={report?.monthly_breakdown ?? []}
          xKey="month"
          yKey={measure}
          xTickFormatter={(value) => String(value)}
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
        <Table<MonthlyBreakdownItem>
          rowKey="month"
          columns={columns}
          dataSource={report?.monthly_breakdown ?? []}
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
