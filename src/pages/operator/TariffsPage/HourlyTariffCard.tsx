import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  InputNumber,
  Skeleton,
  Space,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { getTariffs, updateTariff } from '@/api/tariffs'
import { getErrorMessage } from '@/utils/apiError'
import { formatMoney } from '@/utils/format'

interface TariffFormValues {
  price_per_hour: number
  grace_period_minutes: number
}

export default function HourlyTariffCard() {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<TariffFormValues>()
  const [isEditing, setIsEditing] = useState(false)

  const tariffsQuery = useQuery({
    queryKey: ['tariffs'],
    queryFn: () => getTariffs(),
  })

  const tariff = tariffsQuery.data?.[0] ?? null

  useEffect(() => {
    if (tariff) {
      form.setFieldsValue({
        price_per_hour: tariff.price_per_hour,
        grace_period_minutes: tariff.grace_period_minutes,
      })
    }
  }, [tariff, form])

  const updateMutation = useMutation({
    mutationFn: (values: TariffFormValues) =>
      updateTariff({ id: tariff!.id, ...values }),
    onSuccess: () => {
      message.success(t('tariffs.updateSuccess'))
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['tariffs'] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('tariffs.updateError')))
    },
  })

  const handleCancel = () => {
    if (tariff) {
      form.setFieldsValue({
        price_per_hour: tariff.price_per_hour,
        grace_period_minutes: tariff.grace_period_minutes,
      })
    }
    setIsEditing(false)
  }

  return (
    <Card variant="borderless">
      {tariffsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : !tariff ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('tariffs.emptyState')}
        />
      ) : isEditing ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => updateMutation.mutate(values)}
        >
          <Form.Item
            label={t('tariffs.priceLabel')}
            name="price_per_hour"
            rules={[
              { required: true, message: t('tariffs.priceRequired') },
              { type: 'number', min: 1, message: t('validation.pricePositive') },
            ]}
          >
            <InputNumber
              className="w-full"
              min={1}
              step={500}
              placeholder={t('tariffs.pricePlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('tariffs.gracePeriodLabel')}
            name="grace_period_minutes"
            rules={[
              { required: true, message: t('tariffs.gracePeriodRequired') },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder={t('tariffs.gracePeriodPlaceholder')}
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
                disabled={updateMutation.isPending}
              >
                {t('common.save')}
              </Button>
              <Button onClick={handleCancel} disabled={updateMutation.isPending}>
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <Descriptions column={1} className="w-full">
            <Descriptions.Item label={t('tariffs.priceLabel')}>
              {formatMoney(tariff.price_per_hour)}
            </Descriptions.Item>
            <Descriptions.Item label={t('tariffs.gracePeriodLabel')}>
              {t('tariffs.gracePeriodValue', {
                minutes: tariff.grace_period_minutes,
              })}
            </Descriptions.Item>
          </Descriptions>
          <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            {t('tariffs.editButton')}
          </Button>
        </div>
      )}
    </Card>
  )
}
