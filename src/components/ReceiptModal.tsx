import { useState } from 'react'
import { Button, Descriptions, Modal, Radio, Typography } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { formatDate, formatDuration, formatMoney } from '@/utils/format'
import PlateBadge from './PlateBadge'
import type { ParkingSession, PaymentMethod } from '@/types/parking'

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  session: ParkingSession | null
  amount: number | null
  paymentMethod: PaymentMethod | null
  orgName?: string | null
  onConfirmPaymentMethod?: (method: PaymentMethod) => void
  isConfirmingPaymentMethod?: boolean
}

export default function ReceiptModal({
  open,
  onClose,
  session,
  amount,
  paymentMethod,
  orgName,
  onConfirmPaymentMethod,
  isConfirmingPaymentMethod,
}: ReceiptModalProps) {
  const { t } = useTranslation()
  const issuedAt = new Date()
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    paymentMethod ?? 'cash',
  )

  const needsPaymentMethodChoice =
    !!session && session.exit_method === 'auto' && !!onConfirmPaymentMethod

  const handlePrint = () => {
    if (needsPaymentMethodChoice) {
      onConfirmPaymentMethod!(selectedMethod)
    }
    window.print()
  }

  const paymentMethodLabel = (method: PaymentMethod) =>
    method === 'cash' ? t('paymentMethod.cash') : t('paymentMethod.online')

  return (
    <Modal
      title={t('operatorDashboard.receiptTitle')}
      open={open}
      onCancel={onClose}
      width={{ xs: '90%', sm: '80%', md: 480 }}
      destroyOnHidden
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="print"
          type="primary"
          icon={<PrinterOutlined />}
          loading={isConfirmingPaymentMethod}
          onClick={handlePrint}
        >
          {t('operatorDashboard.printReceipt')}
        </Button>,
      ]}
    >
      {session && (
        <div className="print-receipt">
          <Typography.Title level={5} className="print-receipt-title">
            {orgName || t('operatorDashboard.receiptTitle')}
          </Typography.Title>
          <Descriptions column={1}>
            <Descriptions.Item label={t('sessions.columnPlate')}>
              <PlateBadge value={session.plate_number} />
            </Descriptions.Item>
            <Descriptions.Item label={t('sessions.columnEntered')}>
              {formatDate(session.entered_at)}
            </Descriptions.Item>
            <Descriptions.Item label={t('sessions.columnExited')}>
              {session.exited_at ? formatDate(session.exited_at) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('sessions.columnDuration')}>
              {session.duration_minutes != null
                ? formatDuration(session.duration_minutes)
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('sessions.columnAmount')}>
              <Typography.Text strong className="print-receipt-amount">
                {amount != null ? formatMoney(amount) : '—'}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('paymentMethod.label')}>
              {needsPaymentMethodChoice ? (
                <Radio.Group
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                >
                  <Radio.Button value="cash">
                    {t('paymentMethod.cash')}
                  </Radio.Button>
                  <Radio.Button value="online">
                    {t('paymentMethod.online')}
                  </Radio.Button>
                </Radio.Group>
              ) : paymentMethod ? (
                paymentMethodLabel(paymentMethod)
              ) : (
                '—'
              )}
            </Descriptions.Item>
          </Descriptions>
          <Typography.Text type="secondary" className="print-receipt-issued">
            {t('operatorDashboard.receiptIssuedAt')}: {formatDate(issuedAt)}
          </Typography.Text>
        </div>
      )}
    </Modal>
  )
}
