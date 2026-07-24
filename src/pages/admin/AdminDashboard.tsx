import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Card,
  Col,
  Empty,
  Input,
  Row,
  Skeleton,
  Statistic,
  Table,
  Typography,
  theme as antdTheme,
  type TableProps,
} from 'antd'
import { getAdminStats } from '@/api/adminStats'
import PageHeader from '@/components/PageHeader'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatMoney } from '@/utils/format'
import type { TopOrganization } from '@/types/adminStats'

export default function AdminDashboard() {
  const { t } = useTranslation()
  useDocumentTitle(t('dashboard.title'))
  const { token } = antdTheme.useToken()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    refetchInterval: 60000,
  })

  const offlineCount = data?.offline_organizations_count ?? 0

  const [searchText, setSearchText] = useState('')

  const filteredTopOrganizations = useMemo(() => {
    const list = data?.top_organizations ?? []
    const query = searchText.trim().toLowerCase()
    return query
      ? list.filter((org) => org.name.toLowerCase().includes(query))
      : list
  }, [data?.top_organizations, searchText])

  const columns: TableProps<TopOrganization>['columns'] = [
    {
      title: t('dashboard.columnName'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('dashboard.columnRevenue'),
      dataIndex: 'today_revenue',
      key: 'today_revenue',
      render: (value: number) => formatMoney(value),
    },
    {
      title: t('dashboard.columnParked'),
      dataIndex: 'currently_parked',
      key: 'currently_parked',
    },
  ]

  return (
    <div className="p-6">
      <PageHeader title={t('dashboard.title')} />

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card variant="borderless">
                <Statistic
                  title={t('dashboard.totalOrganizations')}
                  value={data?.total_organizations ?? 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card variant="borderless">
                <Statistic
                  title={t('dashboard.activeOrganizations')}
                  value={data?.active_organizations ?? 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card variant="borderless">
                <Statistic
                  title={t('dashboard.todayRevenue')}
                  value={data?.total_revenue_today ?? 0}
                  formatter={(value) => formatMoney(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card variant="borderless">
                <Statistic
                  title={t('dashboard.monthlyRevenue')}
                  value={data?.total_revenue_monthly ?? 0}
                  formatter={(value) => formatMoney(Number(value))}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card variant="borderless">
                <Statistic
                  title={t('dashboard.currentlyParked')}
                  value={data?.total_currently_parked ?? 0}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card
                variant="borderless"
                style={
                  offlineCount > 0
                    ? { border: `2px solid ${token.colorError}` }
                    : undefined
                }
              >
                <Statistic
                  title={t('dashboard.offlineOrganizations')}
                  value={offlineCount}
                  styles={
                    offlineCount > 0
                      ? { content: { color: token.colorError } }
                      : undefined
                  }
                />
              </Card>
            </Col>
          </Row>

          <Typography.Title level={4}>
            {t('dashboard.topOrganizations')}
          </Typography.Title>

          <Input.Search
            allowClear
            size="large"
            placeholder={t('dashboard.searchPlaceholder')}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            className="mb-4"
          />

          <Card variant="borderless" styles={{ body: { padding: 0 } }}>
            <Table<TopOrganization>
              rowKey="id"
              columns={columns}
              dataSource={filteredTopOrganizations}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('dashboard.emptyState')}
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
