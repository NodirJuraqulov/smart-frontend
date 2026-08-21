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
  Tag,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { getLedSettings, updateLedSettings } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import type { LedSettings } from '@/types/organization'

interface LedSettingsCardProps {
  orgId: number
}

interface LedSettingsFormValues {
  led_host: string
  led_port: number
}

const DEFAULT_LED_PORT = 10000
const HOST_PATTERN = /^(?!.*:\/\/)(?!.*[\s/?#]).+$/

function formValuesFromSettings(
  settings: LedSettings,
): LedSettingsFormValues {
  return {
    led_host: settings.led_host ?? '',
    led_port: settings.led_port ?? DEFAULT_LED_PORT,
  }
}

function isValidPort(value: unknown): boolean {
  const port = Number(value)
  return Number.isInteger(port) && port >= 1 && port <= 65535
}

export default function LedSettingsCard({ orgId }: LedSettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<LedSettingsFormValues>()
  const [isEditing, setIsEditing] = useState(false)
  const values = Form.useWatch([], form)
  const validOrgId = Number.isInteger(orgId) && orgId > 0
  const queryKey = ['organizations', orgId, 'led-settings'] as const

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getLedSettings(orgId),
    enabled: validOrgId,
    retry: false,
  })

  const host = values?.led_host?.trim() ?? ''
  const canSave = !host || isValidPort(values?.led_port)

  const mutation = useMutation({
    mutationFn: (formValues: LedSettingsFormValues) => {
      const ledHost = formValues.led_host.trim()
      return updateLedSettings({
        orgId,
        led_host: ledHost || null,
        led_port: ledHost ? Number(formValues.led_port) : null,
      })
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(queryKey, savedSettings)
      setIsEditing(false)
      message.success(t('ledSettings.saveSuccess'))
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('ledSettings.saveError')))
    },
  })

  if (!validOrgId) return null

  const settings = settingsQuery.data
  const configured = Boolean(settings?.led_host)

  const openEdit = () => {
    if (!settings) return
    form.setFieldsValue(formValuesFromSettings(settings))
    setIsEditing(true)
  }

  return (
    <Card
      variant="borderless"
      title={t('ledSettings.title')}
      data-testid="led-settings-card"
      extra={
        settings ? (
          <Space>
            <Tag color={configured ? 'success' : 'default'}>
              {t(
                configured
                  ? 'ledSettings.configured'
                  : 'ledSettings.notConfigured',
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
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : settingsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title={t('ledSettings.loadError')}
          action={
            <Button size="small" onClick={() => settingsQuery.refetch()}>
              {t('ledSettings.retry')}
            </Button>
          }
        />
      ) : settings ? (
        !isEditing ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('ledSettings.hostLabel')}>
              {settings.led_host || t('ledSettings.notConfigured')}
            </Descriptions.Item>
            <Descriptions.Item label={t('ledSettings.portLabel')}>
              {settings.led_port ?? '—'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Form<LedSettingsFormValues>
            form={form}
            name="led-settings"
            layout="vertical"
            initialValues={formValuesFromSettings(settings)}
            onFinish={(formValues) => mutation.mutate(formValues)}
          >
            <Form.Item
              name="led_host"
              label={t('ledSettings.hostLabel')}
              rules={[
                {
                  pattern: HOST_PATTERN,
                  message: t('ledSettings.hostInvalid'),
                },
              ]}
            >
              <Input
                autoComplete="off"
                placeholder={t('ledSettings.hostPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="led_port"
              label={t('ledSettings.portLabel')}
              rules={[
                {
                  required: Boolean(host),
                  message: t('ledSettings.portRequired'),
                },
                {
                  type: 'integer',
                  min: 1,
                  max: 65535,
                  message: t('ledSettings.portInvalid'),
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
