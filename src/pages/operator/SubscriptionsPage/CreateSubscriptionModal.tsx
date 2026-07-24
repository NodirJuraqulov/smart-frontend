import { Form, Input, Modal, Select, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'
import type { SubscriptionPlan } from '@/types/subscriptionPlan'

export interface CreateSubscriptionFormValues {
  plate_number: string
  plan_id: number
}

interface CreateSubscriptionModalProps {
  open: boolean
  form: FormInstance<CreateSubscriptionFormValues>
  isPending: boolean
  activePlans: SubscriptionPlan[]
  onCancel: () => void
  onSubmit: (values: CreateSubscriptionFormValues) => void
}

export default function CreateSubscriptionModal({
  open,
  form,
  isPending,
  activePlans,
  onCancel,
  onSubmit,
}: CreateSubscriptionModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('subscriptions.createModalTitle')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      width={{ xs: '90%', sm: '80%', md: 500 }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label={t('subscriptions.plateLabel')}
          name="plate_number"
          rules={[
            { required: true, message: t('subscriptions.plateRequired') },
          ]}
        >
          <Input placeholder={t('subscriptions.platePlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('subscriptions.planLabel')}
          name="plan_id"
          rules={[
            { required: true, message: t('subscriptions.planRequired') },
          ]}
        >
          <Select
            placeholder={t('subscriptions.planPlaceholder')}
            options={activePlans.map((plan) => ({
              value: plan.id,
              label: plan.name,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
