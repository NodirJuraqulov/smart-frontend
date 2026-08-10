import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Typography,
} from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import {
  createCashCollection,
  getCashCollectionOperators,
  getCashCollectionPendingSummary,
} from '@/api/cashCollections'
import { getErrorMessage } from '@/utils/apiError'
import { formatDate, formatMoney } from '@/utils/format'
import { CASH_COLLECTIONS_QUERY_KEY } from './cashCollectionAccess'

interface Props {
  orgId: number
}

interface CashCollectionFormValues {
  operator_id: number
  collected_amount: number
  note?: string
}

export default function CashCollectionAction({ orgId }: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<CashCollectionFormValues>()
  const operatorId = Form.useWatch('operator_id', form)

  const operatorsQuery = useQuery({
    queryKey: ['cash-collections', 'operators', orgId],
    queryFn: () => getCashCollectionOperators(orgId),
    enabled: open,
    retry: false,
  })

  const summaryQuery = useQuery({
    queryKey: ['cash-collections', 'pending-summary', orgId, operatorId],
    queryFn: () =>
      getCashCollectionPendingSummary({ orgId, operatorId: operatorId! }),
    enabled: open && operatorId != null,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: (values: CashCollectionFormValues) =>
      createCashCollection({
        orgId,
        operator_id: values.operator_id,
        collected_amount: values.collected_amount,
        note: values.note?.trim() || undefined,
      }),
    onSuccess: () => {
      message.success(t('cashCollections.createSuccess'))
      form.resetFields()
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: CASH_COLLECTIONS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('cashCollections.createError')))
    },
  })

  const closeModal = () => {
    form.resetFields()
    setOpen(false)
  }

  const operators = operatorsQuery.data ?? []
  const hasOperators = operators.length > 0
  const summary = summaryQuery.data

  return (
    <>
      <Button
        icon={<WalletOutlined />}
        onClick={() => setOpen(true)}
        aria-label={t('cashCollections.actionButton')}
      >
        {t('cashCollections.actionButton')}
      </Button>

      {open && (
        <Modal
          open
          title={t('cashCollections.modalTitle')}
          onCancel={closeModal}
          onOk={() => form.submit()}
          confirmLoading={createMutation.isPending}
          okButtonProps={{
            disabled:
              operatorsQuery.isLoading ||
              !hasOperators ||
              createMutation.isPending,
          }}
          okText={t('cashCollections.confirmButton')}
          cancelText={t('common.cancel')}
          width={{ xs: '90%', sm: '80%', md: 560 }}
          destroyOnHidden
        >
          {operatorsQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 3 }} />
          ) : !hasOperators ? (
            <Alert
              type="warning"
              showIcon
              title={t('cashCollections.noOperators')}
            />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => createMutation.mutate(values)}
            >
              <Form.Item
                label={t('cashCollections.operator')}
                name="operator_id"
                rules={[
                  {
                    required: true,
                    message: t('cashCollections.operatorRequired'),
                  },
                ]}
              >
                <Select
                  placeholder={t('cashCollections.operatorPlaceholder')}
                  options={operators.map((operator) => ({
                    label: operator.name,
                    value: operator.id,
                  }))}
                />
              </Form.Item>

              {operatorId == null ? (
                <Typography.Text type="secondary">
                  {t('cashCollections.selectOperatorHint')}
                </Typography.Text>
              ) : summaryQuery.isLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : (
                <Descriptions column={1} size="small" bordered className="mb-4">
                  <Descriptions.Item label={t('cashCollections.expectedCash')}>
                    {formatMoney(summary?.expected_cash_amount ?? 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('cashCollections.onlineAmount')}>
                    {formatMoney(summary?.online_amount ?? 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('cashCollections.period')}>
                    {t('cashCollections.periodValue', {
                      from: formatDate(summary?.period_start),
                    })}
                  </Descriptions.Item>
                </Descriptions>
              )}

              <Form.Item
                label={t('cashCollections.collectedAmount')}
                name="collected_amount"
                rules={[
                  {
                    required: true,
                    message: t('cashCollections.amountRequired'),
                  },
                  {
                    validator: (_rule, value) =>
                      value === undefined ||
                      value === null ||
                      (typeof value === 'number' && value > 0)
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(t('cashCollections.amountPositive')),
                          ),
                  },
                ]}
              >
                <InputNumber
                  className="w-full!"
                  min={0}
                  step={1000}
                  placeholder={t('cashCollections.amountPlaceholder')}
                />
              </Form.Item>
              <Form.Item
                label={t('cashCollections.note')}
                name="note"
                rules={[
                  { max: 500, message: t('cashCollections.noteMaxLength') },
                ]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={t('cashCollections.notePlaceholder')}
                />
              </Form.Item>
            </Form>
          )}
        </Modal>
      )}
    </>
  )
}
