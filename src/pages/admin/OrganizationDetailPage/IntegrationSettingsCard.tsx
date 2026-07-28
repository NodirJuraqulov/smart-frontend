import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Popconfirm,
  Skeleton,
  Space,
  Typography,
} from 'antd'
import {
  CopyOutlined,
  EditOutlined,
  KeyOutlined,
  PrinterOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  getIntegrationSettings,
  regenerateWebhookToken,
  testPrinter,
  testRelay,
  updateIntegrationSettings,
} from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import { copyToClipboard } from '@/utils/clipboard'
import { formatRelativeTime } from '@/utils/format'

const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/
const STALE_SIGNAL_MINUTES = 10

function isSignalStale(timestamp: string | null): boolean {
  if (!timestamp) return true
  const diffMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000
  return diffMinutes > STALE_SIGNAL_MINUTES
}

interface RelayPrinterFormValues {
  relay_entry_ip?: string
  relay_exit_ip?: string
  printer_ip?: string
}

interface WebhookUrlValueProps {
  url: string | null
  onCopy: (url: string) => void
}

function WebhookUrlValue({ url, onCopy }: WebhookUrlValueProps) {
  const { t } = useTranslation()

  return (
    <Space wrap>
      <Typography.Text code>{url ?? '—'}</Typography.Text>
      {url && (
        <Button size="small" icon={<CopyOutlined />} onClick={() => onCopy(url)}>
          {t('integrationSettings.webhookUrlCopyButton')}
        </Button>
      )}
    </Space>
  )
}

interface RelayIpValueProps {
  ip: string | null
  direction: 'entry' | 'exit'
  onTest: (direction: 'entry' | 'exit') => void
  isTesting: boolean
  testingDirection: 'entry' | 'exit' | undefined
}

function RelayIpValue({
  ip,
  direction,
  onTest,
  isTesting,
  testingDirection,
}: RelayIpValueProps) {
  const { t } = useTranslation()

  return (
    <Space>
      <span>{ip || t('integrationSettings.notConfigured')}</span>
      {ip && (
        <Button
          size="small"
          icon={<ThunderboltOutlined />}
          loading={isTesting && testingDirection === direction}
          disabled={isTesting && testingDirection !== direction}
          onClick={() => onTest(direction)}
        >
          {t('integrationSettings.testButton')}
        </Button>
      )}
    </Space>
  )
}

interface LastSignalValueProps {
  timestamp: string | null
}

function LastSignalValue({ timestamp }: LastSignalValueProps) {
  const { t } = useTranslation()
  const stale = isSignalStale(timestamp)

  return (
    <Typography.Text type={stale ? 'warning' : undefined}>
      {timestamp
        ? formatRelativeTime(timestamp)
        : t('integrationSettings.lastSignalNeverReceived')}
    </Typography.Text>
  )
}

interface IntegrationSettingsCardProps {
  orgId: number
}

export default function IntegrationSettingsCard({
  orgId,
}: IntegrationSettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [form] = Form.useForm<RelayPrinterFormValues>()

  const queryKey = ['organizations', orgId, 'integration-settings']

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getIntegrationSettings(orgId),
    enabled: !!orgId,
    retry: false,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const updateMutation = useMutation({
    mutationFn: (values: RelayPrinterFormValues) =>
      updateIntegrationSettings({
        orgId,
        relay_entry_ip: values.relay_entry_ip?.trim() || null,
        relay_exit_ip: values.relay_exit_ip?.trim() || null,
        printer_ip: values.printer_ip?.trim() || null,
      }),
    onSuccess: () => {
      message.success(t('integrationSettings.saveSuccess'))
      invalidate()
      setIsEditing(false)
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('integrationSettings.saveError')))
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateWebhookToken(orgId),
    onSuccess: () => {
      message.success(t('integrationSettings.regenerateTokenSuccess'))
      invalidate()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('integrationSettings.regenerateTokenError')),
      )
    },
  })

  const testRelayMutation = useMutation({
    mutationFn: (direction: 'entry' | 'exit') => testRelay({ orgId, direction }),
    onSuccess: () => {
      message.success(t('integrationSettings.testSuccess'))
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('integrationSettings.testError')))
    },
  })

  const testPrinterMutation = useMutation({
    mutationFn: () => testPrinter(orgId),
    onSuccess: (result) => {
      if (result.success) {
        message.success(t('integrationSettings.testPrinterSuccess'))
      } else if (result.reason === 'printer_not_configured') {
        message.warning(t('integrationSettings.testPrinterNotConfigured'))
      } else {
        message.error(t('integrationSettings.testPrinterError'))
      }
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('integrationSettings.testPrinterError')),
      )
    },
  })

  const handleCopy = async (url: string) => {
    const copied = await copyToClipboard(url)
    if (copied) {
      message.success(t('integrationSettings.webhookUrlCopied'))
    } else {
      message.error(t('integrationSettings.webhookUrlCopyError'))
    }
  }

  const openEdit = () => {
    form.setFieldsValue({
      relay_entry_ip: data?.relay_entry_ip ?? '',
      relay_exit_ip: data?.relay_exit_ip ?? '',
      printer_ip: data?.printer_ip ?? '',
    })
    setIsEditing(true)
  }

  const data = settingsQuery.data

  return (
    <Card variant="borderless" title={t('integrationSettings.title')}>
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div>
            <Typography.Title level={5}>
              {t('integrationSettings.webhookSectionTitle')}
            </Typography.Title>
            <Descriptions column={1}>
              <Descriptions.Item label={t('integrationSettings.webhookEntryUrlLabel')}>
                <WebhookUrlValue url={data.webhook_entry_url} onCopy={handleCopy} />
              </Descriptions.Item>
              <Descriptions.Item label={t('integrationSettings.webhookExitUrlLabel')}>
                <WebhookUrlValue url={data.webhook_exit_url} onCopy={handleCopy} />
              </Descriptions.Item>
            </Descriptions>

            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('integrationSettings.webhookDebugHint')}
            </Typography.Text>
            <Descriptions column={1}>
              <Descriptions.Item label={t('integrationSettings.webhookDebugEntryUrlLabel')}>
                <WebhookUrlValue url={data.webhook_debug_entry_url} onCopy={handleCopy} />
              </Descriptions.Item>
              <Descriptions.Item label={t('integrationSettings.webhookDebugExitUrlLabel')}>
                <WebhookUrlValue url={data.webhook_debug_exit_url} onCopy={handleCopy} />
              </Descriptions.Item>
            </Descriptions>

            <Typography.Title level={5}>
              {t('integrationSettings.lastSignalSectionTitle')}
            </Typography.Title>
            <Descriptions column={1}>
              <Descriptions.Item label={t('integrationSettings.lastSignalEntryLabel')}>
                <LastSignalValue timestamp={data.last_webhook_entry_at} />
              </Descriptions.Item>
              <Descriptions.Item label={t('integrationSettings.lastSignalExitLabel')}>
                <LastSignalValue timestamp={data.last_webhook_exit_at} />
              </Descriptions.Item>
            </Descriptions>

            <Popconfirm
              title={t('integrationSettings.regenerateTokenConfirmTitle')}
              onConfirm={() => regenerateMutation.mutate()}
              okText={t('integrationSettings.regenerateTokenConfirmOk')}
              cancelText={t('common.cancel')}
            >
              <Button className="mt-4" danger icon={<KeyOutlined />} loading={regenerateMutation.isPending}>
                {t('integrationSettings.regenerateTokenButton')}
              </Button>
            </Popconfirm>
          </div>

          <Divider className="my-0" />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Typography.Title level={5} className="m-0!">
                {t('integrationSettings.relayPrinterSectionTitle')}
              </Typography.Title>
              {!isEditing && (
                <Button icon={<EditOutlined />} onClick={openEdit}>
                  {t('integrationSettings.editButton')}
                </Button>
              )}
            </div>

            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => updateMutation.mutate(values)}
              >
                <Form.Item
                  label={t('integrationSettings.relayEntryIpLabel')}
                  name="relay_entry_ip"
                  rules={[
                    { pattern: IP_PATTERN, message: t('integrationSettings.ipValidation') },
                  ]}
                >
                  <Input placeholder={t('integrationSettings.ipPlaceholder')} />
                </Form.Item>
                <Form.Item
                  label={t('integrationSettings.relayExitIpLabel')}
                  name="relay_exit_ip"
                  rules={[
                    { pattern: IP_PATTERN, message: t('integrationSettings.ipValidation') },
                  ]}
                >
                  <Input placeholder={t('integrationSettings.ipPlaceholder')} />
                </Form.Item>
                <Form.Item
                  label={t('integrationSettings.printerIpLabel')}
                  name="printer_ip"
                  rules={[
                    { pattern: IP_PATTERN, message: t('integrationSettings.ipValidation') },
                  ]}
                >
                  <Input placeholder={t('integrationSettings.ipPlaceholder')} />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={updateMutation.isPending}
                      disabled={updateMutation.isPending}
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      disabled={updateMutation.isPending}
                    >
                      {t('common.cancel')}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : (
              <Descriptions column={1}>
                <Descriptions.Item label={t('integrationSettings.relayEntryIpLabel')}>
                  <RelayIpValue
                    ip={data.relay_entry_ip}
                    direction="entry"
                    onTest={(direction) => testRelayMutation.mutate(direction)}
                    isTesting={testRelayMutation.isPending}
                    testingDirection={testRelayMutation.variables}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={t('integrationSettings.relayExitIpLabel')}>
                  <RelayIpValue
                    ip={data.relay_exit_ip}
                    direction="exit"
                    onTest={(direction) => testRelayMutation.mutate(direction)}
                    isTesting={testRelayMutation.isPending}
                    testingDirection={testRelayMutation.variables}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={t('integrationSettings.printerIpLabel')}>
                  {data.printer_ip || t('integrationSettings.notConfigured')}
                </Descriptions.Item>
              </Descriptions>
            )}

            <Button
              icon={<PrinterOutlined />}
              loading={testPrinterMutation.isPending}
              disabled={testPrinterMutation.isPending}
              onClick={() => testPrinterMutation.mutate()}
            >
              {t('integrationSettings.testPrinterButton')}
            </Button>
          </div>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('integrationSettings.empty')}
        />
      )}
    </Card>
  )
}
