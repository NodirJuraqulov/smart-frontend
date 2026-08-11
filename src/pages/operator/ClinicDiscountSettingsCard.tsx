import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Form,
  InputNumber,
  Skeleton,
  Space,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
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
  const [isEditing, setIsEditing] = useState(false)
  const queryKey = ['clinic-discount-settings', orgId]

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getClinicDiscountSettings(orgId),
  })

  const mutation = useMutation({
    mutationFn: (values: ClinicDiscountSettings) =>
      updateClinicDiscountSettings({ orgId, ...values }),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(queryKey, savedSettings)
      setIsEditing(false)
      message.success(t('clinicDiscountSettings.saveSuccess'))
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('clinicDiscountSettings.saveError')),
      )
    },
  })

  const data = settingsQuery.data

  const openEdit = () => {
    if (data) form.setFieldsValue(data)
    setIsEditing(true)
  }

  return (
    <Card
      variant="borderless"
      title={t('clinicDiscountSettings.title')}
      extra={
        !isEditing &&
        data && (
          <Button icon={<EditOutlined />} onClick={openEdit}>
            {t('common.edit')}
          </Button>
        )
      }
    >
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 1 }} />
      ) : isEditing ? (
        <Form<ClinicDiscountSettings>
          form={form}
          layout="vertical"
          initialValues={data}
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

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              disabled={mutation.isPending}
            >
              {t('common.save')}
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              disabled={mutation.isPending}
            >
              {t('common.cancel')}
            </Button>
          </Space>
        </Form>
      ) : (
        <Descriptions column={1} size="small">
          <Descriptions.Item label={t('clinicDiscountSettings.percentLabel')}>
            {data ? `${data.clinic_discount_percent}%` : '—'}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  )
}
