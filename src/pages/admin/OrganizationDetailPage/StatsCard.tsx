import { Card, Col, Row, Skeleton, Statistic } from 'antd'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '@/utils/format'
import type { OrganizationStats } from '@/types/organization'

interface StatsCardProps {
  isLoading: boolean
  stats: OrganizationStats | undefined
}

export default function StatsCard({ isLoading, stats }: StatsCardProps) {
  const { t } = useTranslation()

  return (
    <Card variant="borderless" title={t('orgDetail.statsTitle')}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={12} md={8}>
            <Statistic
              title={t('organizations.todayEntries')}
              value={stats?.today_entries ?? 0}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t('organizations.todayExits')}
              value={stats?.today_exits ?? 0}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t('organizations.todayRevenue')}
              value={stats?.today_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t('organizations.currentlyParked')}
              value={stats?.currently_parked ?? 0}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t('organizations.totalSessions')}
              value={stats?.total_sessions ?? 0}
            />
          </Col>
          <Col xs={12} md={8}>
            <Statistic
              title={t('organizations.totalRevenue')}
              value={stats?.total_revenue ?? 0}
              formatter={(value) => formatMoney(Number(value))}
            />
          </Col>
        </Row>
      )}
    </Card>
  )
}
