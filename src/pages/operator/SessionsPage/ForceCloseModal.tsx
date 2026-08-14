import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Alert,
  App as AntdApp,
  Button,
  DatePicker,
  Descriptions,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
} from 'antd'
import { forceCloseSession } from '@/api/parking'
import type { ForceCloseSessionPayload } from '@/api/parking'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate, formatDuration } from '@/utils/format'
import PlateBadge from '@/components/PlateBadge'
import type { ParkingSession, PaymentMethod } from '@/types/parking'

interface ForceCloseFormValues {
  exited_at: Dayjs
  amount?: number
  payment_method: PaymentMethod
}

interface ForceCloseModalProps {
  session: ParkingSession | null
  onClose: () => void
}

export default function ForceCloseModal({
  session,
  onClose,
}: ForceCloseModalProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ForceCloseFormValues>()

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: ForceCloseSessionPayload
    }) => forceCloseSession(id, payload),
    onSuccess: () => {
      message.success(t('sessions.forceCloseSuccess'))
      queryClient.invalidateQueries({ queryKey: ['parking', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['parking', 'sessions'] })
      form.resetFields()
      onClose()
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('sessions.forceCloseError')))
    },
  })

  const handleFinish = (values: ForceCloseFormValues) => {
    if (!session) return
    const payload: ForceCloseSessionPayload = {
      exited_at: values.exited_at.toISOString(),
      payment_method: values.payment_method,
    }
    if (values.amount != null) payload.amount = values.amount
    mutation.mutate({ id: session.id, payload })
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  const elapsedMinutes = session
    ? Math.max(0, Math.floor((Date.now() - new Date(session.entered_at).getTime()) / 60000))
    : 0

  return (
    <Modal
      title={t('sessions.forceCloseModalTitle')}
      open={!!session}
      onCancel={handleCancel}
      width={{ xs: '90%', sm: '80%', md: 500 }}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          {t('common.cancel')}
        </Button>,
        <Popconfirm
          key="confirm"
          title={t('sessions.forceCloseConfirmTitle')}
          description={t('sessions.forceCloseConfirmDescription')}
          onConfirm={() => form.submit()}
          okText={t('sessions.forceCloseConfirmOk')}
          cancelText={t('common.cancel')}
        >
          <Button danger type="primary" loading={mutation.isPending}>
            {t('sessions.forceCloseSubmitButton')}
          </Button>
        </Popconfirm>,
      ]}
    >
      {session && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ exited_at: dayjs(), payment_method: 'cash' }}
        >
          <Descriptions column={1} className="mb-4">
            <Descriptions.Item label={t('sessions.columnPlate')}>
              <PlateBadge value={session.plate_number} />
            </Descriptions.Item>
            <Descriptions.Item label={t('sessions.columnEntered')}>
              {formatDate(session.entered_at)}
            </Descriptions.Item>
            <Descriptions.Item label={t('sessions.forceCloseElapsedLabel')}>
              {formatDuration(elapsedMinutes)}
            </Descriptions.Item>
          </Descriptions>

          <Alert
            type="warning"
            showIcon
            title={t('sessions.forceCloseWarningTitle')}
            description={t('sessions.forceCloseWarningDescription')}
            className="mb-4"
          />

          <Form.Item
            label={t('sessions.forceCloseExitTimeLabel')}
            name="exited_at"
            rules={[
              { required: true, message: t('sessions.forceCloseExitTimeRequired') },
            ]}
          >
            <DatePicker showTime format="YYYY-MM-DD HH:mm" className="w-full" />
          </Form.Item>

          <Form.Item
            label={t('sessions.forceCloseAmountLabel')}
            name="amount"
            extra={t('sessions.forceCloseAmountHint')}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder={t('sessions.forceCloseAmountPlaceholder')}
            />
          </Form.Item>

          <Form.Item
            label={t('paymentMethod.label')}
            name="payment_method"
            rules={[{ required: true, message: t('paymentMethod.required') }]}
          >
            <Radio.Group>
              <Radio.Button value="cash">{t('paymentMethod.cash')}</Radio.Button>
              <Radio.Button value="online">
                {t('paymentMethod.online')}
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
