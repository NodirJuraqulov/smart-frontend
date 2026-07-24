import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button, Card, Form, InputNumber } from 'antd'
import { updateCapacity } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'

interface CapacityFormValues {
  capacity_total?: number
}

interface CapacityCardProps {
  orgId: number
  capacityTotal: number | null
}

export default function CapacityCard({
  orgId,
  capacityTotal,
}: CapacityCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CapacityFormValues>()

  useEffect(() => {
    form.setFieldsValue({ capacity_total: capacityTotal ?? undefined })
  }, [capacityTotal, form])

  const mutation = useMutation({
    mutationFn: (values: CapacityFormValues) =>
      updateCapacity({ id: orgId, capacity_total: values.capacity_total ?? null }),
    onSuccess: () => {
      message.success(t('capacity.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('capacity.updateError')))
    },
  })

  return (
    <Card variant="borderless" title={t('capacity.title')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item
          label={t('capacity.totalLabel')}
          name="capacity_total"
          extra={t('capacity.totalHint')}
        >
          <InputNumber
            className="w-full"
            min={0}
            precision={0}
            placeholder={t('capacity.totalPlaceholder')}
          />
        </Form.Item>
        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.isPending}
            disabled={mutation.isPending}
          >
            {t('common.save')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}
