import { Form, Input, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

export interface CreateVipFormValues {
  plate_number: string
  note?: string
}

interface CreateVipModalProps {
  open: boolean
  form: FormInstance<CreateVipFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: CreateVipFormValues) => void
}

export default function CreateVipModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: CreateVipModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('subscriptions.vipCreateModalTitle')}
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
          label={t('subscriptions.vipPlateLabel')}
          name="plate_number"
          rules={[
            { required: true, message: t('subscriptions.vipPlateRequired') },
          ]}
        >
          <Input placeholder={t('subscriptions.vipPlatePlaceholder')} />
        </Form.Item>
        <Form.Item label={t('subscriptions.vipNoteLabel')} name="note">
          <Input placeholder={t('subscriptions.vipNotePlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
