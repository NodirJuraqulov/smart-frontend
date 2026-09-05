import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Radio,
  Space,
  Spin,
  Typography,
  type FormInstance,
} from 'antd'
import { useTranslation } from 'react-i18next'
import type { PaymentMethod } from '@/types/parking'

export interface ManualFormValues {
  plate_number: string
  payment_method?: PaymentMethod
}

export interface ManualCardWaitingState {
  sessionId: number
  operationNumber: string
  plateNumber: string
}

interface ManualEntryModalProps {
  open: boolean
  isExit: boolean
  form: FormInstance<ManualFormValues>
  isPending: boolean
  cardEnabled: boolean
  cardWaiting: ManualCardWaitingState | null
  cardDeclined: boolean
  isRetryingCard: boolean
  onCancel: () => void
  onSubmit: (values: ManualFormValues) => void
  onRetryCard: () => void
  onSwitchPaymentMethod: () => void
}

export default function ManualEntryModal({
  open,
  isExit,
  form,
  isPending,
  cardEnabled,
  cardWaiting,
  cardDeclined,
  isRetryingCard,
  onCancel,
  onSubmit,
  onRetryCard,
  onSwitchPaymentMethod,
}: ManualEntryModalProps) {
  const { t } = useTranslation()
  const isCardResolving =
    isRetryingCard || Boolean(cardWaiting && !cardDeclined)
  const cardFlowActive = Boolean(cardWaiting)

  return (
    <Modal
      title={
        isExit
          ? t('operatorDashboard.manualExitModalTitle')
          : t('operatorDashboard.manualEntryModalTitle')
      }
      open={open}
      onCancel={isCardResolving ? undefined : onCancel}
      onOk={() => form.submit()}
      confirmLoading={isPending}
      okButtonProps={{ disabled: isPending }}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      closable={!isCardResolving}
      mask={{ closable: false }}
      footer={cardFlowActive ? null : undefined}
      width={{ xs: '90%', sm: '80%', md: 500 }}
      destroyOnHidden
    >
      {cardWaiting ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-4">
          {cardDeclined ? (
            <>
              <Alert
                className="w-full"
                type="warning"
                showIcon
                title={t('paymentMethod.cardPaymentDeclined')}
                description={t('paymentMethod.retryCardHint')}
              />
              <Space wrap>
                <Button
                  type="primary"
                  loading={isRetryingCard}
                  onClick={onRetryCard}
                >
                  {t('paymentMethod.retryCardPayment')}
                </Button>
                <Button
                  disabled={isRetryingCard}
                  onClick={onSwitchPaymentMethod}
                >
                  {t('paymentMethod.switchToCashOnline')}
                </Button>
              </Space>
            </>
          ) : (
            <>
              <Spin size="large" />
              <Typography.Text>
                {t('paymentMethod.cardPaymentPending')}
              </Typography.Text>
            </>
          )}
        </div>
      ) : (
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
              {
                required: true,
                message: t('operatorDashboard.plateNumberRequired'),
              },
            ]}
          >
            <Input
              placeholder={t('operatorDashboard.plateNumberPlaceholder')}
              autoFocus
              disabled={isPending}
            />
          </Form.Item>
          {isExit && (
            <Form.Item
              label={t('paymentMethod.label')}
              name="payment_method"
              rules={[{ required: true, message: t('paymentMethod.required') }]}
            >
              <Radio.Group disabled={isPending}>
                <Radio.Button value="cash">
                  {t('paymentMethod.cash')}
                </Radio.Button>
                <Radio.Button value="online">
                  {t('paymentMethod.online')}
                </Radio.Button>
                {cardEnabled && (
                  <Radio.Button value="card">
                    {t('paymentMethod.card')}
                  </Radio.Button>
                )}
              </Radio.Group>
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  )
}
