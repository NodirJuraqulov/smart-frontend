import { Form, Input, Modal, Select, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

const LOGIN_PATTERN = /^[a-zA-Z0-9_]+$/

export interface CreateOperatorFormValues {
  name: string
  login: string
  password: string
  org_id: number
}

interface CreateOperatorModalProps {
  open: boolean
  form: FormInstance<CreateOperatorFormValues>
  orgOptions: { label: string; value: number }[]
  orgsLoading: boolean
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: CreateOperatorFormValues) => void
}

export default function CreateOperatorModal({
  open,
  form,
  orgOptions,
  orgsLoading,
  isPending,
  onCancel,
  onSubmit,
}: CreateOperatorModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('operators.createModalTitle')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      width={{ xs: '90%', sm: '80%', md: 600 }}
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
          <Input placeholder={t('operators.loginFieldPlaceholder')} autoComplete="off" />
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
        <Form.Item
          label={t('operators.orgLabel')}
          name="org_id"
          rules={[{ required: true, message: t('operators.orgRequired') }]}
        >
          <Select
            placeholder={t('operators.orgPlaceholder')}
            options={orgOptions}
            loading={orgsLoading}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
