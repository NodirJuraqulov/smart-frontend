import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Form,
  InputNumber,
  Space,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
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
  const [isEditing, setIsEditing] = useState(false)
  const [form] = Form.useForm<CapacityFormValues>()

  const mutation = useMutation({
    mutationFn: (values: CapacityFormValues) =>
      updateCapacity({ id: orgId, capacity_total: values.capacity_total ?? null }),
    onSuccess: () => {
      message.success(t('capacity.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setIsEditing(false)
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('capacity.updateError')))
    },
  })

  const openEdit = () => {
    form.setFieldsValue({ capacity_total: capacityTotal ?? undefined })
    setIsEditing(true)
  }

  return (
    <Card
      variant="borderless"
      title={t('capacity.title')}
      extra={
        !isEditing && (
          <Button icon={<EditOutlined />} onClick={openEdit}>
            {t('capacity.editButton')}
          </Button>
        )
      }
    >
      {isEditing ? (
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
          </Form.Item>
        </Form>
      ) : (
        <Descriptions column={1}>
          <Descriptions.Item label={t('capacity.totalLabel')}>
            {capacityTotal ?? t('capacity.unlimitedValue')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  )
}
