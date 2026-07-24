import { Form, Input, Modal, Select, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

const LOGIN_PATTERN = /^[a-zA-Z0-9_]+$/

export interface EditOperatorFormValues {
  name: string
  login: string
  org_id: number
}

interface EditOperatorModalProps {
  open: boolean
  form: FormInstance<EditOperatorFormValues>
  orgOptions: { label: string; value: number }[]
  orgsLoading: boolean
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: EditOperatorFormValues) => void
}

export default function EditOperatorModal({
  open,
  form,
  orgOptions,
  orgsLoading,
  isPending,
  onCancel,
  onSubmit,
}: EditOperatorModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('operators.editModalTitle')}
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
