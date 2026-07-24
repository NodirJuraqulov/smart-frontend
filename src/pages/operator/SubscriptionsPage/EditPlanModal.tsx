import { Form, Input, InputNumber, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

export interface EditPlanFormValues {
  name: string
  duration_days: number
  price: number
}

interface EditPlanModalProps {
  open: boolean
  form: FormInstance<EditPlanFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: EditPlanFormValues) => void
}

export default function EditPlanModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: EditPlanModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('subscriptions.planEditModalTitle')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      width={{ xs: '90%', sm: '80%', md: 500 }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label={t('subscriptions.planNameLabel')}
          name="name"
          rules={[
            { required: true, message: t('subscriptions.planNameRequired') },
          ]}
        >
          <Input placeholder={t('subscriptions.planNamePlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('subscriptions.planDurationLabel')}
          name="duration_days"
          rules={[
            {
              required: true,
              message: t('subscriptions.planDurationRequired'),
            },
            { type: 'number', min: 1, message: t('validation.pricePositive') },
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
            placeholder={t('subscriptions.planDurationPlaceholder')}
          />
        </Form.Item>
        <Form.Item
          label={t('subscriptions.planPriceLabel')}
          name="price"
          rules={[
            { required: true, message: t('subscriptions.planPriceRequired') },
            { type: 'number', min: 1, message: t('validation.pricePositive') },
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
            step={1000}
            placeholder={t('subscriptions.planPricePlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
