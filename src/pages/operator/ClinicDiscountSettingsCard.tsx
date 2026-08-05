import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button, Card, Form, InputNumber, Skeleton } from 'antd'
import {
  getClinicDiscountSettings,
  updateClinicDiscountSettings,
} from '@/api/clinicDiscounts'
import { getErrorMessage } from '@/utils/apiError'
import type { ClinicDiscountSettings } from '@/types/clinicDiscount'

interface ClinicDiscountSettingsCardProps {
  orgId: number
}

export default function ClinicDiscountSettingsCard({
  orgId,
}: ClinicDiscountSettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ClinicDiscountSettings>()
  const queryKey = ['clinic-discount-settings', orgId]

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getClinicDiscountSettings(orgId),
  })

  useEffect(() => {
    if (settingsQuery.data) {
      form.setFieldsValue(settingsQuery.data)
    }
  }, [settingsQuery.data, form])

  const mutation = useMutation({
    mutationFn: (values: ClinicDiscountSettings) =>
      updateClinicDiscountSettings({ orgId, ...values }),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(queryKey, savedSettings)
      message.success(t('clinicDiscountSettings.saveSuccess'))
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('clinicDiscountSettings.saveError')),
      )
    },
  })

  return (
    <Card variant="borderless" title={t('clinicDiscountSettings.title')}>
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : (
        <Form<ClinicDiscountSettings>
          form={form}
          layout="vertical"
          initialValues={settingsQuery.data}
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item
            name="clinic_discount_percent"
            label={t('clinicDiscountSettings.percentLabel')}
            rules={[
              {
                required: true,
                message: t('clinicDiscountSettings.percentRequired'),
              },
              {
                type: 'number',
                min: 0,
                max: 100,
                message: t('clinicDiscountSettings.percentInvalid'),
              },
            ]}
          >
            <InputNumber min={0} max={100} style={{ width: 160 }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </Form>
      )}
    </Card>
  )
}
