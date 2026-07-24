import { Form, Input, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

export interface ResetPasswordFormValues {
  password: string
}

interface ResetPasswordModalProps {
  open: boolean
  form: FormInstance<ResetPasswordFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: ResetPasswordFormValues) => void
}

export default function ResetPasswordModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: ResetPasswordModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('operators.resetPasswordModalTitle')}
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
          label={t('operators.newPasswordLabel')}
          name="password"
          rules={[
            { required: true, message: t('operators.newPasswordRequired') },
            { min: 6, message: t('validation.passwordMinLength') },
          ]}
        >
          <Input.Password
            placeholder={t('operators.newPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
