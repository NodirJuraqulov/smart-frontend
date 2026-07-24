import {
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Typography,
  type FormInstance,
} from 'antd'
import { useTranslation } from 'react-i18next'

const LOGIN_PATTERN = /^[a-zA-Z0-9_]+$/

export interface CreateOrganizationFormValues {
  name: string
  address?: string
  owner_name: string
  owner_login: string
  owner_password: string
  add_operator: boolean
  operator_name?: string
  operator_login?: string
  operator_password?: string
  tariff_price: number
  tariff_grace_period_minutes?: number
}

interface CreateOrganizationModalProps {
  open: boolean
  form: FormInstance<CreateOrganizationFormValues>
  isPending: boolean
  addOperator: boolean
  onCancel: () => void
  onSubmit: (values: CreateOrganizationFormValues) => void
}

export default function CreateOrganizationModal({
  open,
  form,
  isPending,
  addOperator,
  onCancel,
  onSubmit,
}: CreateOrganizationModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('organizations.createModalTitle')}
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
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
        initialValues={{ add_operator: false }}
      >
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

        <Typography.Title level={5}>
          {t('organizations.ownerSectionTitle')}
        </Typography.Title>
        <Form.Item
          label={t('organizations.ownerNameLabel')}
          name="owner_name"
          rules={[
            { required: true, message: t('organizations.ownerNameRequired') },
          ]}
        >
          <Input placeholder={t('organizations.ownerNamePlaceholder')} />
        </Form.Item>
        <Form.Item
          label={t('organizations.ownerLoginLabel')}
          name="owner_login"
          rules={[
            { required: true, message: t('organizations.ownerLoginRequired') },
            { min: 3, message: t('validation.loginMinLength') },
            { pattern: LOGIN_PATTERN, message: t('validation.loginPattern') },
          ]}
        >
          <Input
            placeholder={t('organizations.ownerLoginPlaceholder')}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item
          label={t('organizations.ownerPasswordLabel')}
          name="owner_password"
          rules={[
            {
              required: true,
              message: t('organizations.ownerPasswordRequired'),
            },
            { min: 6, message: t('validation.passwordMinLength') },
          ]}
        >
          <Input.Password
            placeholder={t('organizations.ownerPasswordPlaceholder')}
            autoComplete="new-password"
          />
        </Form.Item>

        <Typography.Title level={5}>
          {t('organizations.operatorSectionTitle')}
        </Typography.Title>
        <Form.Item name="add_operator" valuePropName="checked" className="mb-0">
          <Checkbox>{t('organizations.addOperatorCheckbox')}</Checkbox>
        </Form.Item>
        {addOperator && (
          <>
            <Form.Item
              label={t('organizations.operatorNameLabel')}
              name="operator_name"
              rules={[
                {
                  required: true,
                  message: t('organizations.operatorNameRequired'),
                },
              ]}
            >
              <Input placeholder={t('organizations.operatorNamePlaceholder')} />
            </Form.Item>
            <Form.Item
              label={t('organizations.operatorLoginLabel')}
              name="operator_login"
              rules={[
                {
                  required: true,
                  message: t('organizations.operatorLoginRequired'),
                },
                { min: 3, message: t('validation.loginMinLength') },
                { pattern: LOGIN_PATTERN, message: t('validation.loginPattern') },
              ]}
            >
              <Input
                placeholder={t('organizations.operatorLoginPlaceholder')}
                autoComplete="off"
              />
            </Form.Item>
            <Form.Item
              label={t('organizations.operatorPasswordLabel')}
              name="operator_password"
              rules={[
                {
                  required: true,
                  message: t('organizations.operatorPasswordRequired'),
                },
                { min: 6, message: t('validation.passwordMinLength') },
              ]}
            >
              <Input.Password
                placeholder={t('organizations.operatorPasswordPlaceholder')}
                autoComplete="new-password"
              />
            </Form.Item>
          </>
        )}

        <Typography.Title level={5}>
          {t('organizations.tariffSectionTitle')}
        </Typography.Title>
        <Form.Item
          label={t('organizations.tariffPriceLabel')}
          name="tariff_price"
          rules={[
            { required: true, message: t('organizations.tariffPriceRequired') },
            { type: 'number', min: 1, message: t('validation.pricePositive') },
          ]}
        >
          <InputNumber
            className="w-full"
            min={1}
            step={500}
            placeholder={t('organizations.tariffPricePlaceholder')}
          />
        </Form.Item>
        <Form.Item
          label={t('organizations.tariffGracePeriodLabel')}
          name="tariff_grace_period_minutes"
        >
          <InputNumber
            className="w-full"
            min={0}
            placeholder={t('organizations.tariffGracePeriodPlaceholder')}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
