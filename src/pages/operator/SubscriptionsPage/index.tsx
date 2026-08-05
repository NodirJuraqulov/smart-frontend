import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Typography } from 'antd'
import { getSubscriptionPlans } from '@/api/subscriptionPlans'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import PlansSection from './PlansSection'
import SubscribersSection from './SubscribersSection'

export default function SubscriptionsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('subscriptions.title'))

  const plansQuery = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <Typography.Title level={3} className="m-0!">
        {t('subscriptions.title')}
      </Typography.Title>

      <PlansSection />
      <SubscribersSection plans={plansQuery.data ?? []} />
    </div>
  )
}
