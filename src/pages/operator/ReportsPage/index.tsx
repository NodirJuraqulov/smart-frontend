import { useTranslation } from 'react-i18next'
import { Tabs, Typography } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAppSelector } from '@/hooks/redux'
import DailyReportTab from './DailyReportTab'
import MonthlyReportTab from './MonthlyReportTab'
import YearlyReportTab from './YearlyReportTab'
import CashCollectionAction from './CashCollectionAction'
import CashCollectionHistoryTab from './CashCollectionHistoryTab'
import { canManageCashCollections } from './cashCollectionAccess'

export default function ReportsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('reports.title'))
  const user = useAppSelector((state) => state.auth.user)
  const orgId = user?.org_id ?? null
  const showCashCollections = canManageCashCollections(user?.role, orgId)

  const tabItems = [
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
  ]

  if (showCashCollections && orgId != null) {
    tabItems.push({
      key: 'cash-collections',
      label: t('cashCollections.historyTab'),
      children: <CashCollectionHistoryTab orgId={orgId} />,
    })
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Typography.Title level={3} className="m-0!">
          {t('reports.title')}
        </Typography.Title>
        {showCashCollections && orgId != null && (
          <CashCollectionAction orgId={orgId} />
        )}
      </div>

      <Tabs defaultActiveKey="daily" items={tabItems} />
    </div>
  )
}
