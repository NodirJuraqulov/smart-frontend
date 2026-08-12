import { Form, Input, Modal, type FormInstance } from 'antd'
import { useTranslation } from 'react-i18next'

const PATTERN_RULE = /^[NLnl]{1,20}$/

export interface PlateFormatFormValues {
  pattern: string
  description?: string
}

interface Props {
  open: boolean
  title: string
  okText: string
  form: FormInstance<PlateFormatFormValues>
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: PlateFormatFormValues) => void
}

export default function FormatFormModal({
  open,
  title,
  okText,
  form,
  isPending,
  onCancel,
  onSubmit,
}: Props) {
  const { t } = useTranslation()

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={okText}
      cancelText={t('common.cancel')}
      width={{ xs: '90%', sm: '80%', md: 520 }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label={t('plateFormats.patternLabel')}
          name="pattern"
          extra={t('plateFormats.patternHint')}
          rules={[
            { required: true, message: t('plateFormats.patternRequired') },
            { pattern: PATTERN_RULE, message: t('plateFormats.patternInvalid') },
          ]}
        >
          <Input
            autoComplete="off"
            placeholder={t('plateFormats.patternPlaceholder')}
          />
        </Form.Item>
        <Form.Item
          label={t('plateFormats.descriptionLabel')}
          name="description"
          rules={[{ max: 255, message: t('plateFormats.descriptionMaxLength') }]}
        >
          <Input placeholder={t('plateFormats.descriptionPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
