import { Form, InputNumber, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'
import type { IntervalFormValues } from '@/components/CreateIntervalModal'

interface EditIntervalModalProps {
  open: boolean
  form: FormInstance<IntervalFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: IntervalFormValues) => void
}

export default function EditIntervalModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: EditIntervalModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('pricingMode.intervalEditModalTitle')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      width={{ xs: '90%', sm: '80%', md: 480 }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label={t('pricingMode.fromMinuteLabel')}
          name="from_minutes"
          rules={[
            {
              required: true,
              message: t('pricingMode.fromMinuteRequired'),
            },
          ]}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item
          label={t('pricingMode.toMinuteLabel')}
          name="to_minutes"
          extra={t('pricingMode.toMinuteHint')}
        >
          <InputNumber className="w-full" min={0} />
        </Form.Item>
        <Form.Item
          label={t('pricingMode.intervalPriceLabel')}
          name="price"
          rules={[
            { required: true, message: t('pricingMode.intervalPriceRequired') },
            { type: 'number', min: 1, message: t('validation.pricePositive') },
          ]}
        >
          <InputNumber className="w-full" min={1} step={500} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
