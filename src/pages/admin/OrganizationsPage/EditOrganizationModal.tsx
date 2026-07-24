import { Form, Input, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

export interface EditOrganizationFormValues {
  name: string
  address?: string
}

interface EditOrganizationModalProps {
  open: boolean
  form: FormInstance<EditOrganizationFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: EditOrganizationFormValues) => void
}

export default function EditOrganizationModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: EditOrganizationModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('organizations.editModalTitle')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      width={{ xs: '90%', sm: '80%', md: 600 }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label={t('organizations.nameLabel')}
          name="name"
          rules={[{ required: true, message: t('organizations.nameRequired') }]}
        >
          <Input placeholder={t('organizations.namePlaceholder')} />
        </Form.Item>
        <Form.Item label={t('organizations.addressLabel')} name="address">
          <Input placeholder={t('organizations.addressPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
