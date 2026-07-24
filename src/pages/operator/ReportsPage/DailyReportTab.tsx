import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Card,
  Col,
  DatePicker,
  Empty,
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

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

export default function DailyReportTab() {
  const { t } = useTranslation()
  const [date, setDate] = useState<Dayjs>(dayjs())
  const [measure, setMeasure] = useState<'entries' | 'revenue'>('entries')

  const reportQuery = useQuery({
    queryKey: ['reports', 'daily', date.format('YYYY-MM-DD')],
    queryFn: () => getDailyReport(date.format('YYYY-MM-DD')),
    placeholderData: keepPreviousData,
  })

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

  if (reportQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const report = reportQuery.data

  return (
    <div className="flex flex-col gap-4">
      <DatePicker
        size="large"
        value={date}
        onChange={(value) => value && setDate(value)}
        allowClear={false}
        placeholder={t('reports.datePlaceholder')}
      />

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
    </div>
  )
}
