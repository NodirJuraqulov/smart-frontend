import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Button,
  Card,
  Empty,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  type TableProps,
} from 'antd'
import { getExitControlReport } from '@/api/reports'
import type { ExitControlDay, ExitControlMetrics } from '@/types/reports'
import { formatMoney } from '@/utils/format'

interface ExitControlReportBlockProps {
  from: string
  to: string
}

interface ExitControlRow {
  key: string
  date: string
  notFound: number
  forcedOpen: number
  vipSubscription: number
  estimatedLoss: number
}

const safeNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const optionalNumber = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const toRow = (day: ExitControlDay, index: number): ExitControlRow => ({
  key: `${day.date ?? 'unknown'}-${index}`,
  date: typeof day.date === 'string' && day.date ? day.date : '—',
  notFound: safeNumber(day.not_found_count),
  forcedOpen: safeNumber(day.forced_open_count),
  vipSubscription: safeNumber(day.forced_open_vip_or_subscription),
  estimatedLoss: safeNumber(day.estimated_loss_som),
})

const normalizeTotals = (
  totals: ExitControlMetrics | undefined,
  rows: ExitControlRow[],
) => ({
  notFound:
    optionalNumber(totals?.not_found_count) ??
    rows.reduce((sum, row) => sum + row.notFound, 0),
  forcedOpen:
    optionalNumber(totals?.forced_open_count) ??
    rows.reduce((sum, row) => sum + row.forcedOpen, 0),
  vipSubscription:
    optionalNumber(totals?.forced_open_vip_or_subscription) ??
    rows.reduce((sum, row) => sum + row.vipSubscription, 0),
  estimatedLoss:
    optionalNumber(totals?.estimated_loss_som) ??
    rows.reduce((sum, row) => sum + row.estimatedLoss, 0),
})

export default function ExitControlReportBlock({
  from,
  to,
}: ExitControlReportBlockProps) {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['reports', 'exit-control', from, to],
    queryFn: () => getExitControlReport({ from, to }),
    retry: false,
  })

  if (query.isLoading) {
    return (
      <Card variant="borderless" title={t('reports.exitControlTitle')}>
        <div data-testid="exit-control-loading">
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </Card>
    )
  }

  if (query.isError) {
    return (
      <Card variant="borderless" title={t('reports.exitControlTitle')}>
        <Alert
          type="error"
          showIcon
          title={t('reports.exitControlLoadError')}
          action={
            <Button size="small" onClick={() => void query.refetch()}>
              {t('reports.exitControlRetry')}
            </Button>
          }
        />
      </Card>
    )
  }

  const days = Array.isArray(query.data?.days) ? query.data.days : []
  const rows = days.map(toRow)
  const totals = normalizeTotals(query.data?.totals, rows)
  const avgLoss = safeNumber(query.data?.avg_loss_som)
  const estimated = query.data?.estimated === true

  const columns: TableProps<ExitControlRow>['columns'] = [
    {
      title: t('reports.exitControlDay'),
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: t('reports.exitControlNotFound'),
      dataIndex: 'notFound',
      key: 'notFound',
    },
    {
      title: t('reports.exitControlForcedOpen'),
      dataIndex: 'forcedOpen',
      key: 'forcedOpen',
    },
    {
      title: t('reports.exitControlVipSubscription'),
      dataIndex: 'vipSubscription',
      key: 'vipSubscription',
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <span>{t('reports.exitControlEstimatedLoss')}</span>
          {estimated && (
            <Tooltip
              title={t('reports.exitControlEstimateTooltip', {
                amount: avgLoss.toLocaleString('uz-UZ'),
              })}
            >
              <Tag color="gold">{t('reports.exitControlEstimatedBadge')}</Tag>
            </Tooltip>
          )}
        </div>
      ),
      dataIndex: 'estimatedLoss',
      key: 'estimatedLoss',
      render: (value: number) => formatMoney(value),
    },
  ]

  return (
    <Card
      variant="borderless"
      title={t('reports.exitControlTitle')}
      styles={{ body: { padding: 0 } }}
    >
      <Table<ExitControlRow>
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('reports.exitControlEmpty')}
            />
          ),
        }}
        summary={() =>
          rows.length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                {t('reports.exitControlTotal')}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1}>{totals.notFound}</Table.Summary.Cell>
              <Table.Summary.Cell index={2}>{totals.forcedOpen}</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>{totals.vipSubscription}</Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                {formatMoney(totals.estimatedLoss)}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          ) : null
        }
      />
    </Card>
  )
}
