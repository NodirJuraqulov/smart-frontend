import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  InputNumber,
  Popconfirm,
  Radio,
  Skeleton,
  Space,
  Table,
  type TableProps,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  createTariffIntervalAdmin,
  deleteTariffIntervalAdmin,
  getTariffIntervalsAdmin,
  updateTariffIntervalAdmin,
  updatePricingMode,
} from '@/api/organizations'
import { updateTariff } from '@/api/tariffs'
import { getErrorMessage } from '@/utils/apiError'
import { formatMoney } from '@/utils/format'
import type { PricingMode } from '@/types/organization'
import type { TariffInterval } from '@/types/tariffInterval'
import type { Tariff, UpdateTariffPayload } from '@/types/tariff'
import CreateIntervalModal, {
  type IntervalFormValues,
} from '@/components/CreateIntervalModal'
import EditIntervalModal from '@/components/EditIntervalModal'

interface PricingModeCardProps {
  orgId: number
  pricingMode: PricingMode
  tariff: Tariff | null
  tariffLoading: boolean
}

export default function PricingModeCard({
  orgId,
  pricingMode,
  tariff,
  tariffLoading,
}: PricingModeCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingInterval, setEditingInterval] =
    useState<TariffInterval | null>(null)
  const [createForm] = Form.useForm<IntervalFormValues>()
  const [editForm] = Form.useForm<IntervalFormValues>()

  const [editingPrice, setEditingPrice] = useState(false)
  const [editingGracePeriod, setEditingGracePeriod] = useState(false)
  const [priceForm] = Form.useForm<{ price_per_hour: number }>()
  const [gracePeriodForm] = Form.useForm<{ grace_period_minutes: number }>()

  const intervalsQuery = useQuery({
    queryKey: ['tariff-intervals', orgId],
    queryFn: () => getTariffIntervalsAdmin(orgId),
    enabled: pricingMode === 'interval',
  })

  useEffect(() => {
    if (editingInterval) {
      editForm.setFieldsValue({
        from_minutes: editingInterval.from_minutes,
        to_minutes: editingInterval.to_minutes ?? undefined,
        price: editingInterval.price,
      })
    }
  }, [editingInterval, editForm])

  const invalidateIntervals = () =>
    queryClient.invalidateQueries({ queryKey: ['tariff-intervals', orgId] })

  const modeMutation = useMutation({
    mutationFn: updatePricingMode,
    onSuccess: () => {
      message.success(t('pricingMode.updateSuccess'))
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('pricingMode.updateError')))
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: IntervalFormValues) =>
      createTariffIntervalAdmin({
        orgId,
        from_minutes: values.from_minutes,
        to_minutes: values.to_minutes ?? null,
        price: values.price,
      }),
    onSuccess: () => {
      message.success(t('pricingMode.intervalCreateSuccess'))
      invalidateIntervals()
      setCreateOpen(false)
      createForm.resetFields()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('pricingMode.intervalCreateError')),
      )
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: IntervalFormValues & { id: number }) =>
      updateTariffIntervalAdmin({
        orgId,
        id: values.id,
        from_minutes: values.from_minutes,
        to_minutes: values.to_minutes ?? null,
        price: values.price,
      }),
    onSuccess: () => {
      message.success(t('pricingMode.intervalUpdateSuccess'))
      invalidateIntervals()
      setEditingInterval(null)
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('pricingMode.intervalUpdateError')),
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTariffIntervalAdmin({ orgId, id }),
    onSuccess: () => {
      message.success(t('pricingMode.intervalDeleteSuccess'))
      invalidateIntervals()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('pricingMode.intervalDeleteError')),
      )
    },
  })

  const updateTariffMutation = useMutation({
    mutationFn: (payload: UpdateTariffPayload) =>
      updateTariff({ id: tariff!.id, ...payload }),
    onSuccess: () => {
      message.success(t('tariffs.updateSuccess'))
      setEditingPrice(false)
      setEditingGracePeriod(false)
      queryClient.invalidateQueries({ queryKey: ['tariffs', orgId] })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('tariffs.updateError')))
    },
  })

  const openPriceEdit = () => {
    priceForm.setFieldsValue({ price_per_hour: tariff!.price_per_hour })
    setEditingPrice(true)
  }

  const openGracePeriodEdit = () => {
    gracePeriodForm.setFieldsValue({
      grace_period_minutes: tariff!.grace_period_minutes,
    })
    setEditingGracePeriod(true)
  }

  const handlePriceSubmit = (values: { price_per_hour: number }) => {
    updateTariffMutation.mutate({
      price_per_hour: values.price_per_hour,
      grace_period_minutes: tariff!.grace_period_minutes,
    })
  }

  const handleGracePeriodSubmit = (values: {
    grace_period_minutes: number
  }) => {
    updateTariffMutation.mutate({
      price_per_hour: tariff!.price_per_hour,
      grace_period_minutes: values.grace_period_minutes,
    })
  }

  const columns: TableProps<TariffInterval>['columns'] = [
    {
      title: t('pricingMode.fromMinuteLabel'),
      dataIndex: 'from_minutes',
      key: 'from_minutes',
    },
    {
      title: t('pricingMode.toMinuteLabel'),
      dataIndex: 'to_minutes',
      key: 'to_minutes',
      render: (value: number | null) =>
        value != null ? value : t('pricingMode.toMinuteInfinite'),
    },
    {
      title: t('pricingMode.intervalPriceLabel'),
      dataIndex: 'price',
      key: 'price',
      render: (value: number) => formatMoney(value),
    },
    {
      title: t('pricingMode.intervalColumnActions'),
      key: 'actions',
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setEditingInterval(record)}
          >
            {t('pricingMode.intervalEditButton')}
          </Button>
          <Popconfirm
            title={t('pricingMode.intervalDeleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
              disabled={
                deleteMutation.isPending &&
                deleteMutation.variables === record.id
              }
            >
              {t('pricingMode.intervalDeleteButton')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card variant="borderless" title={t('pricingMode.title')}>
      <Radio.Group
        value={pricingMode}
        disabled={modeMutation.isPending}
        onChange={(e) =>
          modeMutation.mutate({
            id: orgId,
            pricing_mode: e.target.value as PricingMode,
          })
        }
        className="mb-4"
      >
        <Radio.Button value="hourly">{t('pricingMode.hourly')}</Radio.Button>
        <Radio.Button value="interval">
          {t('pricingMode.interval')}
        </Radio.Button>
      </Radio.Group>

      {pricingMode === 'hourly' &&
        (tariffLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : !tariff ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('orgDetail.tariffsEmpty')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {editingPrice ? (
              <Form
                form={priceForm}
                layout="vertical"
                onFinish={handlePriceSubmit}
              >
                <Form.Item
                  label={t('tariffs.priceLabel')}
                  name="price_per_hour"
                  rules={[
                    { required: true, message: t('tariffs.priceRequired') },
                    {
                      type: 'number',
                      min: 1,
                      message: t('validation.pricePositive'),
                    },
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    min={1}
                    step={500}
                    placeholder={t('tariffs.pricePlaceholder')}
                  />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updateTariffMutation.isPending}
                      disabled={updateTariffMutation.isPending}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      onClick={() => setEditingPrice(false)}
                      disabled={updateTariffMutation.isPending}
                    >
                      {t('common.cancel')}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <div className="flex items-center gap-3">
                <Descriptions column={1} className="flex-1">
                  <Descriptions.Item label={t('tariffs.priceLabel')}>
                    {formatMoney(tariff.price_per_hour)}
                  </Descriptions.Item>
                </Descriptions>
                <Button icon={<EditOutlined />} onClick={openPriceEdit}>
                  {t('tariffs.editButton')}
                </Button>
              </div>
            )}

            {editingGracePeriod ? (
              <Form
                form={gracePeriodForm}
                layout="vertical"
                onFinish={handleGracePeriodSubmit}
              >
                <Form.Item
                  label={t('tariffs.gracePeriodLabel')}
                  name="grace_period_minutes"
                  rules={[
                    {
                      required: true,
                      message: t('tariffs.gracePeriodRequired'),
                    },
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    min={0}
                    placeholder={t('tariffs.gracePeriodPlaceholder')}
                  />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updateTariffMutation.isPending}
                      disabled={updateTariffMutation.isPending}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      onClick={() => setEditingGracePeriod(false)}
                      disabled={updateTariffMutation.isPending}
                    >
                      {t('common.cancel')}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <div className="flex items-center gap-3">
                <Descriptions column={1} className="flex-1">
                  <Descriptions.Item label={t('tariffs.gracePeriodLabel')}>
                    {t('tariffs.gracePeriodValue', {
                      minutes: tariff.grace_period_minutes,
                    })}
                  </Descriptions.Item>
                </Descriptions>
                <Button icon={<EditOutlined />} onClick={openGracePeriodEdit}>
                  {t('tariffs.editButton')}
                </Button>
              </div>
            )}
          </div>
        ))}

      {pricingMode === 'interval' && (
        <>
          <div className="mb-3 flex justify-end">
            <Button
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              {t('pricingMode.intervalCreateButton')}
            </Button>
          </div>
          <Table<TariffInterval>
            rowKey="id"
            columns={columns}
            dataSource={intervalsQuery.data ?? []}
            loading={intervalsQuery.isLoading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('pricingMode.intervalEmptyState')}
                />
              ),
            }}
          />
        </>
      )}

      <CreateIntervalModal
        open={createOpen}
        form={createForm}
        isPending={createMutation.isPending}
        onCancel={() => {
          setCreateOpen(false)
          createForm.resetFields()
        }}
        onSubmit={(values) => createMutation.mutate(values)}
      />

      <EditIntervalModal
        open={!!editingInterval}
        form={editForm}
        isPending={updateMutation.isPending}
        onCancel={() => setEditingInterval(null)}
        onSubmit={(values) =>
          editingInterval &&
          updateMutation.mutate({ id: editingInterval.id, ...values })
        }
      />
    </Card>
  )
}
