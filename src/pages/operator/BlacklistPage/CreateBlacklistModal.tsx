import { Form, Input, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'
import type { CreateBlacklistedVehiclePayload } from '@/types/blacklist'

interface CreateBlacklistModalProps {
  open: boolean
  form: FormInstance<CreateBlacklistedVehiclePayload>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: CreateBlacklistedVehiclePayload) => void
}

export default function CreateBlacklistModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: CreateBlacklistModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('blacklist.createModalTitle')}
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
          label={t('blacklist.plateLabel')}
          name="plate_number"
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('blacklist.plateRequired'),
            },
            { max: 20, message: t('blacklist.plateMaxLength') },
          ]}
        >
          <Input
            maxLength={20}
            placeholder={t('blacklist.platePlaceholder')}
          />
        </Form.Item>
        <Form.Item
          label={t('blacklist.reasonLabel')}
          name="reason"
          rules={[{ max: 500, message: t('blacklist.reasonMaxLength') }]}
        >
          <Input.TextArea
            rows={3}
            maxLength={500}
            placeholder={t('blacklist.reasonPlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
