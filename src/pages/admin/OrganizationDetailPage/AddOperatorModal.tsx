import { Form, Input, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

const LOGIN_PATTERN = /^[a-zA-Z0-9_]+$/

export interface AddOperatorFormValues {
  name: string
  login: string
  password: string
}

interface AddOperatorModalProps {
  open: boolean
  form: FormInstance<AddOperatorFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: AddOperatorFormValues) => void
}

export default function AddOperatorModal({
  open,
  form,
  isPending,
  onCancel,
  onSubmit,
}: AddOperatorModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('orgDetail.addOperatorModalTitle')}
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
          label={t('operators.nameLabel')}
          name="name"
          rules={[{ required: true, message: t('operators.nameRequired') }]}
        >
          <Input placeholder={t('operators.namePlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('operators.loginLabel')}
          name="login"
          rules={[
            { required: true, message: t('operators.loginRequired') },
            { min: 3, message: t('validation.loginMinLength') },
            { pattern: LOGIN_PATTERN, message: t('validation.loginPattern') },
          ]}
        >
          <Input
            placeholder={t('operators.loginFieldPlaceholder')}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item
          label={t('operators.passwordLabel')}
          name="password"
          rules={[
            { required: true, message: t('operators.passwordRequired') },
            { min: 6, message: t('validation.passwordMinLength') },
          ]}
        >
          <Input.Password
            placeholder={t('operators.passwordPlaceholder')}
            autoComplete="new-password"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
