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
import { getYearlyReport } from '@/api/reports'
import { formatMoney } from '@/utils/format'
import SingleSeriesBarChart from '@/components/SingleSeriesBarChart'
import type { MonthlyBreakdownItem } from '@/types/reports'

export default function YearlyReportTab() {
  const { t } = useTranslation()
  const [year, setYear] = useState<Dayjs>(dayjs())
  const [measure, setMeasure] = useState<'entries' | 'exits' | 'revenue'>(
    'entries',
  )

  const reportQuery = useQuery({
    queryKey: ['reports', 'yearly', year.year()],
    queryFn: () => getYearlyReport(year.year()),
    placeholderData: keepPreviousData,
  })

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

  if (reportQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const report = reportQuery.data

  return (
    <div className="flex flex-col gap-4">
      <DatePicker
        size="large"
        picker="year"
        value={year}
        onChange={(value) => value && setYear(value)}
        allowClear={false}
        placeholder={t('reports.yearPlaceholder')}
      />

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
    </div>
  )
}
