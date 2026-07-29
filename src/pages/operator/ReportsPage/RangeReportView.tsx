import { Card, Col, Empty, Row, Segmented, Statistic, Table } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import SingleSeriesBarChart from '@/components/SingleSeriesBarChart'
import { formatMoney } from '@/utils/format'
import type { ReportRangeResponse, ReportType } from '@/types/reports'
import { normalizeRangeItems, safeTotals, type RangeViewItem } from './reportRange'

interface Props {
  type: ReportType
  report?: ReportRangeResponse
}

export default function RangeReportView({ type, report }: Props) {
  const { t } = useTranslation()
  const [measure, setMeasure] = useState<'entries' | 'exits' | 'revenue'>('entries')
  const totals = safeTotals(report?.totals ?? {})
  const items = normalizeRangeItems(type, report)

  const columns = [
    { title: t(`reports.${type === 'daily' ? 'dateColumn' : type === 'monthly' ? 'monthColumn' : 'yearColumn'}`), dataIndex: 'period', key: 'period' },
    { title: t('reports.entriesColumn'), dataIndex: 'entries', key: 'entries' },
    { title: t('reports.exitsColumn'), dataIndex: 'exits', key: 'exits' },
    { title: t('reports.revenueColumn'), dataIndex: 'revenue', key: 'revenue', render: formatMoney },
    { title: t('reports.cashRevenue'), dataIndex: 'cashRevenue', key: 'cashRevenue', render: formatMoney },
    { title: t('reports.onlineRevenue'), dataIndex: 'onlineRevenue', key: 'onlineRevenue', render: formatMoney },
    { title: t('reports.regularRevenue'), dataIndex: 'regularRevenue', key: 'regularRevenue', render: formatMoney },
    { title: t('reports.subscriptionRevenue'), dataIndex: 'subscriptionRevenue', key: 'subscriptionRevenue', render: formatMoney },
  ]

  return (
    <>
      <Row gutter={[16, 16]}>
        {([
          ['totalEntries', totals.total_entries, false],
          ['totalExits', totals.total_exits, false],
          ['totalRevenue', totals.total_revenue, true],
          ['cashRevenue', totals.cash_revenue, true],
          ['onlineRevenue', totals.online_revenue, true],
          ['regularRevenue', totals.regular_revenue, true],
          ['subscriptionRevenue', totals.subscription_revenue, true],
        ] as const).map(([label, value, money]) => (
          <Col xs={12} md={8} lg={6} key={label}>
            <Card variant="borderless">
              <Statistic title={t(`reports.${label}`)} value={value} formatter={money ? (current) => formatMoney(Number(current) || 0) : undefined} />
            </Card>
          </Col>
        ))}
      </Row>

      <Segmented
        value={measure}
        onChange={(value) => setMeasure(value as typeof measure)}
        options={[
          { label: t('reports.measureEntries'), value: 'entries' },
          { label: t('reports.measureExits'), value: 'exits' },
          { label: t('reports.measureRevenue'), value: 'revenue' },
        ]}
      />

      <Card variant="borderless">
        <SingleSeriesBarChart<RangeViewItem>
          data={items}
          xKey="period"
          yKey={measure}
          xTickFormatter={String}
          yTickFormatter={measure === 'revenue' ? (value) => value.toLocaleString('uz-UZ') : undefined}
          tooltipFormatter={measure === 'revenue' ? formatMoney : undefined}
        />
      </Card>

      <Card variant="borderless" title={t('reports.tableViewTitle')} styles={{ body: { padding: 0 } }}>
        <Table<RangeViewItem>
          rowKey="key"
          columns={columns}
          dataSource={items}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('reports.emptyState')} /> }}
        />
      </Card>
    </>
  )
}
