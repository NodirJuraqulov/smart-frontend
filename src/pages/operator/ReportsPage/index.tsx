import { useTranslation } from 'react-i18next'
import { Tabs, Typography } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import DailyReportTab from './DailyReportTab'
import MonthlyReportTab from './MonthlyReportTab'
import YearlyReportTab from './YearlyReportTab'

export default function ReportsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('reports.title'))

  return (
    <div className="p-6">
      <Typography.Title level={3} className="m-0!">
        {t('reports.title')}
      </Typography.Title>

      <Tabs
        defaultActiveKey="daily"
        items={[
          {
            key: 'daily',
            label: t('reports.dailyTab'),
            children: <DailyReportTab />,
          },
          {
            key: 'monthly',
            label: t('reports.monthlyTab'),
            children: <MonthlyReportTab />,
          },
          {
            key: 'yearly',
            label: t('reports.yearlyTab'),
            children: <YearlyReportTab />,
          },
        ]}
      />
    </div>
  )
}
