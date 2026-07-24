import { Card, Col, Row, Skeleton, Statistic, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getCapacity } from '@/api/parking'
import { formatMoney } from '@/utils/format'
import { palette } from '@/theme/palette'
import type { DailyReport } from '@/types/reports'

interface StatsRowProps {
  isLoading: boolean
  data: DailyReport | undefined
}

export default function StatsRow({ isLoading, data }: StatsRowProps) {
  const { t } = useTranslation()

  const capacityQuery = useQuery({
    queryKey: ['parking', 'capacity'],
    queryFn: getCapacity,
    refetchInterval: 10000,
  })

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 2 }} />
  }

  const occupied = data?.currently_parked ?? 0
  const total = capacityQuery.data?.total ?? null
  const isFull = total != null && occupied >= total

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title={t('operatorDashboard.todayEntries')}
            value={data?.total_entries ?? 0}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title={t('operatorDashboard.todayExits')}
            value={data?.total_exits ?? 0}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card variant="borderless">
          <Statistic
            title={t('operatorDashboard.todayRevenue')}
            value={data?.total_revenue ?? 0}
            formatter={(value) => formatMoney(Number(value))}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card
          variant="borderless"
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
