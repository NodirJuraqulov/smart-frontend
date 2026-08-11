import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Card, Skeleton, Space, Switch, Typography } from 'antd'
import {
  getEmergencyBarrierSettings,
  updateEmergencyBarrierSettings,
} from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { emergencyBarrierSettingsQueryKey } from './emergencyBarrierSettingsKey'

interface EmergencyBarrierSettingsCardProps {
  orgId: number
}

export default function EmergencyBarrierSettingsCard({
  orgId,
}: EmergencyBarrierSettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const queryKey = emergencyBarrierSettingsQueryKey(orgId)

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getEmergencyBarrierSettings(orgId),
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (enabled: boolean) =>
      updateEmergencyBarrierSettings({ orgId, enabled }),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKey, settings)
      message.success(t('emergencyBarrierSettings.saveSuccess'))
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('emergencyBarrierSettings.saveError')),
      )
    },
  })

  return (
    <Card variant="borderless" title={t('emergencyBarrierSettings.title')}>
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <Space>
          <Switch
            checked={
              settingsQuery.data?.emergency_barrier_button_enabled ?? false
            }
            loading={mutation.isPending}
            disabled={mutation.isPending || settingsQuery.isError}
            onChange={(checked) => mutation.mutate(checked)}
          />
          <Typography.Text>
            {t('emergencyBarrierSettings.toggleLabel')}
          </Typography.Text>
        </Space>
      )}
    </Card>
  )
}
