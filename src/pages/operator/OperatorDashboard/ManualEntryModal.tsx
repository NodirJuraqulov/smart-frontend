import { Form, Input, Modal, Radio, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'
import type { PaymentMethod } from '@/types/parking'

export interface ManualFormValues {
  plate_number: string
  payment_method?: PaymentMethod
}

interface ManualEntryModalProps {
  open: boolean
  isExit: boolean
  form: FormInstance<ManualFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: ManualFormValues) => void
}

export default function ManualEntryModal({
  open,
  isExit,
  form,
  isPending,
  onCancel,
  onSubmit,
}: ManualEntryModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={
        isExit
          ? t('operatorDashboard.manualExitModalTitle')
          : t('operatorDashboard.manualEntryModalTitle')
      }
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{ payment_method: 'cash' }}
      >
        <Form.Item
          label={t('operatorDashboard.plateNumberLabel')}
          name="plate_number"
          rules={[
            { required: true, message: t('operatorDashboard.plateNumberRequired') },
          ]}
        >
          <Input
            placeholder={t('operatorDashboard.plateNumberPlaceholder')}
            autoFocus
          />
        </Form.Item>
        {isExit && (
          <Form.Item
            label={t('paymentMethod.label')}
            name="payment_method"
            rules={[{ required: true, message: t('paymentMethod.required') }]}
          >
            <Radio.Group>
              <Radio.Button value="cash">{t('paymentMethod.cash')}</Radio.Button>
              <Radio.Button value="online">
                {t('paymentMethod.online')}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        )}
      </Form>
    </Modal>
  )
}
