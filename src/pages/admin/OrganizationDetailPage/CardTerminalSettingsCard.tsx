import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Skeleton,
  Space,
  Switch,
  Tag,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import {
  getCardTerminalSettings,
  updateCardTerminalSettings,
} from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import type { CardTerminalSettings } from '@/types/organization'

interface CardTerminalSettingsCardProps {
  orgId: number
}

interface CardTerminalSettingsFormValues {
  card_terminal_enabled: boolean
  card_terminal_ip: string
  card_terminal_port: number
  card_terminal_id: string
  card_terminal_merchant_id: string
}

const DEFAULT_CARD_TERMINAL_PORT = 62801
const HOST_PATTERN = /^(?!.*:\/\/)(?!.*[\s/?#]).+$/

function formValuesFromSettings(
  settings: CardTerminalSettings,
): CardTerminalSettingsFormValues {
  return {
    card_terminal_enabled: settings.card_terminal_enabled,
    card_terminal_ip: settings.card_terminal_ip ?? '',
    card_terminal_port:
      settings.card_terminal_port ?? DEFAULT_CARD_TERMINAL_PORT,
    card_terminal_id: settings.card_terminal_id ?? '',
    card_terminal_merchant_id: settings.card_terminal_merchant_id ?? '',
  }
}

function isValidPort(value: unknown): boolean {
  const port = Number(value)
  return Number.isInteger(port) && port >= 1 && port <= 65535
}

export default function CardTerminalSettingsCard({
  orgId,
}: CardTerminalSettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CardTerminalSettingsFormValues>()
  const [isEditing, setIsEditing] = useState(false)
  const values = Form.useWatch([], form)
  const validOrgId = Number.isInteger(orgId) && orgId > 0
  const queryKey = [
    'organizations',
    orgId,
    'card-terminal-settings',
  ] as const

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getCardTerminalSettings(orgId),
    enabled: validOrgId,
    retry: false,
  })

  const enabled = values?.card_terminal_enabled ?? false
  const ip = values?.card_terminal_ip?.trim() ?? ''
  const canSave = !enabled || (Boolean(ip) && isValidPort(values?.card_terminal_port))

  const mutation = useMutation({
    mutationFn: (formValues: CardTerminalSettingsFormValues) =>
      updateCardTerminalSettings(orgId, {
        card_terminal_enabled: formValues.card_terminal_enabled,
        card_terminal_ip: formValues.card_terminal_ip.trim() || null,
        card_terminal_port: formValues.card_terminal_port
          ? Number(formValues.card_terminal_port)
          : null,
        card_terminal_id: formValues.card_terminal_id.trim() || null,
        card_terminal_merchant_id:
          formValues.card_terminal_merchant_id.trim() || null,
      }),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(queryKey, savedSettings)
      setIsEditing(false)
      message.success(t('cardTerminalSettings.saveSuccess'))
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('cardTerminalSettings.saveError')),
      )
    },
  })

  if (!validOrgId) return null

  const settings = settingsQuery.data

  const openEdit = () => {
    if (!settings) return
    form.setFieldsValue(formValuesFromSettings(settings))
    setIsEditing(true)
  }

  return (
    <Card
      variant="borderless"
      title={t('cardTerminalSettings.title')}
      data-testid="card-terminal-settings-card"
      extra={
        settings ? (
          <Space>
            <Tag color={settings.card_terminal_enabled ? 'success' : 'default'}>
              {t(
                settings.card_terminal_enabled
                  ? 'cardTerminalSettings.enabled'
                  : 'cardTerminalSettings.disabled',
              )}
            </Tag>
            {!isEditing && (
              <Button size="small" icon={<EditOutlined />} onClick={openEdit}>
                {t('common.edit')}
              </Button>
            )}
          </Space>
        ) : null
      }
    >
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : settingsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title={t('cardTerminalSettings.loadError')}
          action={
            <Button size="small" onClick={() => settingsQuery.refetch()}>
              {t('cardTerminalSettings.retry')}
            </Button>
          }
        />
      ) : settings ? (
        !isEditing ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('cardTerminalSettings.ipLabel')}>
              {settings.card_terminal_ip || t('cardTerminalSettings.notConfigured')}
            </Descriptions.Item>
            <Descriptions.Item label={t('cardTerminalSettings.portLabel')}>
              {settings.card_terminal_port ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={t('cardTerminalSettings.terminalIdLabel')}
            >
              {settings.card_terminal_id || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={t('cardTerminalSettings.merchantIdLabel')}
            >
              {settings.card_terminal_merchant_id || '—'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Form<CardTerminalSettingsFormValues>
            form={form}
            name="card-terminal-settings"
            layout="vertical"
            initialValues={formValuesFromSettings(settings)}
            onFinish={(formValues) => mutation.mutate(formValues)}
          >
            <Form.Item
              name="card_terminal_enabled"
              label={t('cardTerminalSettings.enabledLabel')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="card_terminal_ip"
              label={t('cardTerminalSettings.ipLabel')}
              rules={[
                {
                  required: enabled,
                  whitespace: true,
                  message: t('cardTerminalSettings.ipRequired'),
                },
                {
                  pattern: HOST_PATTERN,
                  message: t('cardTerminalSettings.ipInvalid'),
                },
              ]}
            >
              <Input
                autoComplete="off"
                placeholder={t('cardTerminalSettings.ipPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="card_terminal_port"
              label={t('cardTerminalSettings.portLabel')}
              rules={[
                {
                  required: enabled,
                  message: t('cardTerminalSettings.portRequired'),
                },
                {
                  type: 'integer',
                  min: 1,
                  max: 65535,
                  message: t('cardTerminalSettings.portInvalid'),
                },
              ]}
            >
              <InputNumber
                className="w-full"
                min={1}
                max={65535}
                precision={0}
              />
            </Form.Item>

            <Form.Item
              name="card_terminal_id"
              label={t('cardTerminalSettings.terminalIdLabel')}
              rules={[
                { max: 64, message: t('cardTerminalSettings.textMaxLength') },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            <Form.Item
              name="card_terminal_merchant_id"
              label={t('cardTerminalSettings.merchantIdLabel')}
              rules={[
                { max: 64, message: t('cardTerminalSettings.textMaxLength') },
              ]}
            >
              <Input autoComplete="off" />
            </Form.Item>

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={mutation.isPending}
                disabled={!canSave || mutation.isPending}
              >
                {t('common.save')}
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                disabled={mutation.isPending}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form>
        )
      ) : null}
    </Card>
  )
}
