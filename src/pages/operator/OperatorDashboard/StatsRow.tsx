import { Alert, Card, Col, Row, Skeleton, Statistic, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getCapacity } from '@/api/parking'
import { formatMoney } from '@/utils/format'
import { palette } from '@/theme/palette'
import type { DailyReport } from '@/types/reports'

interface StatsRowProps {
  isLoading: boolean
  isError: boolean
  data: DailyReport | undefined
}

export default function StatsRow({ isLoading, isError, data }: StatsRowProps) {
  const { t } = useTranslation()

  const capacityQuery = useQuery({
    queryKey: ['parking', 'capacity'],
    queryFn: getCapacity,
    refetchInterval: 10000,
    retry: false,
  })

  if (isLoading || capacityQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 2 }} />
  }

  if (isError || !data) {
    return (
      <Alert
        type="error"
        showIcon
        title={t('operatorDashboard.statsLoadError')}
      />
    )
  }

  const occupied = capacityQuery.data?.occupied ?? data?.currently_parked ?? 0
  const total = capacityQuery.data?.total ?? null
  const available = capacityQuery.data?.available ?? null
  const isFull = available != null && available <= 0

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card
          variant="borderless"
          title={t('operatorDashboard.todayActivity')}
          data-testid="dashboard-stat-card"
          className="h-full"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Statistic
                title={t('operatorDashboard.todayEntries')}
                value={data.total_entries}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title={t('operatorDashboard.todayExits')}
                value={data.total_exits}
              />
            </Col>
          </Row>
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          variant="borderless"
          data-testid="dashboard-stat-card"
          className="h-full"
        >
          <Statistic
            title={t('operatorDashboard.cashPayment')}
            value={data.cash_revenue}
            formatter={(value) => formatMoney(Number(value))}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          variant="borderless"
          data-testid="dashboard-stat-card"
          className="h-full"
        >
          <Statistic
            title={t('operatorDashboard.onlinePayment')}
            value={data.online_revenue}
            formatter={(value) => formatMoney(Number(value))}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          variant="borderless"
          data-testid="dashboard-stat-card"
          className="h-full"
          style={isFull ? { border: `1px solid ${palette.warning}` } : undefined}
        >
          <Statistic
            title={t('operatorDashboard.currentlyParked')}
            value={occupied}
            styles={
              isFull ? { content: { color: palette.warning } } : undefined
            }
            suffix={
              total != null ? (
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  / {total}
                </Typography.Text>
              ) : undefined
            }
          />
        </Card>
      </Col>
    </Row>
  )
}
