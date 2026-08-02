import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Skeleton,
  Tag,
} from 'antd'
import {
  getCameraRelaySettings,
  updateCameraRelaySettings,
} from '@/api/organizations'
import { useAppSelector } from '@/hooks/redux'
import { getErrorMessage } from '@/utils/apiError'
import type {
  CameraRelayDirectionPayload,
  CameraRelayDirectionSettings,
  CameraRelaySettings,
} from '@/types/organization'

type CameraDirection = keyof CameraRelaySettings

interface CameraRelayFormValues {
  host: string
  port: number
  username: string
  password?: string
  channel: number
}

interface DirectionFormProps {
  direction: CameraDirection
  orgId: number
  settings: CameraRelayDirectionSettings
  queryKey: readonly unknown[]
}

const HOST_PATTERN = /^(?!.*:\/\/)(?!.*[\s/?#]).+$/

function formValuesFromSettings(
  settings: CameraRelayDirectionSettings,
): CameraRelayFormValues {
  return {
    host: settings.host ?? '',
    port: settings.port || 80,
    username: settings.username ?? '',
    password: '',
    channel: settings.channel || 1,
  }
}

function isPositiveInteger(value: unknown): boolean {
  const number = Number(value)
  return Number.isInteger(number) && number > 0
}

function CameraRelayDirectionForm({
  direction,
  orgId,
  settings,
  queryKey,
}: DirectionFormProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CameraRelayFormValues>()
  const values = Form.useWatch([], form)
  const cameraLabel = t(
    direction === 'entry'
      ? 'cameraRelaySettings.entryCameraTitle'
      : 'cameraRelaySettings.exitCameraTitle',
  )

  useEffect(() => {
    form.setFieldsValue({
      host: settings.host ?? '',
      port: settings.port || 80,
      username: settings.username ?? '',
      password: '',
      channel: settings.channel || 1,
    })
  }, [
    form,
    orgId,
    settings.channel,
    settings.configured,
    settings.host,
    settings.port,
    settings.username,
  ])

  const password = values?.password ?? ''
  const canSave =
    Boolean(values?.host?.trim()) &&
    Boolean(values?.username?.trim()) &&
    isPositiveInteger(values?.port) &&
    Number(values?.port) <= 65535 &&
    isPositiveInteger(values?.channel) &&
    (settings.configured || Boolean(password.trim()))

  const mutation = useMutation({
    mutationFn: (formValues: CameraRelayFormValues) => {
      const newPassword = formValues.password ?? ''
      const directionPayload: CameraRelayDirectionPayload = {
        host: formValues.host.trim(),
        port: Number(formValues.port),
        username: formValues.username.trim(),
        channel: Number(formValues.channel),
        ...(newPassword.trim() ? { password: newPassword } : {}),
      }
      return updateCameraRelaySettings({
        orgId,
        ...(direction === 'entry'
          ? { entry: directionPayload }
          : { exit: directionPayload }),
      })
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(queryKey, savedSettings)
      form.setFieldsValue(formValuesFromSettings(savedSettings[direction]))
      message.success(
        t('cameraRelaySettings.saveSuccess', { camera: cameraLabel }),
      )
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('cameraRelaySettings.saveError')),
      )
    },
  })

  return (
    <Card
      size="small"
      data-testid={`camera-relay-${direction}-form`}
      title={cameraLabel}
      extra={
        <Tag color={settings.configured ? 'success' : 'default'}>
          {t(
            settings.configured
              ? 'cameraRelaySettings.configured'
              : 'cameraRelaySettings.notConfigured',
          )}
        </Tag>
      }
    >
      <Form<CameraRelayFormValues>
        form={form}
        name={`camera-relay-${direction}`}
        layout="vertical"
        initialValues={formValuesFromSettings(settings)}
        onFinish={(formValues) => mutation.mutate(formValues)}
      >
        <Form.Item
          name="host"
          label={t('cameraRelaySettings.hostLabel')}
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('cameraRelaySettings.hostRequired'),
            },
            {
              pattern: HOST_PATTERN,
              message: t('cameraRelaySettings.hostInvalid'),
            },
          ]}
        >
          <Input
            autoComplete="off"
            placeholder={t('cameraRelaySettings.hostPlaceholder')}
          />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
          <Form.Item
            name="port"
            label={t('cameraRelaySettings.portLabel')}
            rules={[
              {
                required: true,
                message: t('cameraRelaySettings.portRequired'),
              },
              {
                type: 'integer',
                min: 1,
                max: 65535,
                message: t('cameraRelaySettings.portInvalid'),
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
            name="channel"
            label={t('cameraRelaySettings.channelLabel')}
            rules={[
              {
                required: true,
                message: t('cameraRelaySettings.channelRequired'),
              },
              {
                type: 'integer',
                min: 1,
                message: t('cameraRelaySettings.channelInvalid'),
              },
            ]}
          >
            <InputNumber className="w-full" min={1} precision={0} />
          </Form.Item>
        </div>

        <Form.Item
          name="username"
          label={t('cameraRelaySettings.usernameLabel')}
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('cameraRelaySettings.usernameRequired'),
            },
          ]}
        >
          <Input autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="password"
          label={t('cameraRelaySettings.passwordLabel')}
          extra={
            settings.configured
              ? t('cameraRelaySettings.passwordPreserveHint')
              : undefined
          }
          rules={[
            {
              required: !settings.configured,
              whitespace: true,
              message: t('cameraRelaySettings.passwordRequired'),
            },
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            placeholder={t('cameraRelaySettings.passwordPlaceholder')}
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={mutation.isPending}
          disabled={!canSave || mutation.isPending}
        >
          {t('common.save')}
        </Button>
      </Form>
    </Card>
  )
}

interface CameraRelaySettingsCardProps {
  orgId: number
}

export default function CameraRelaySettingsCard({
  orgId,
}: CameraRelaySettingsCardProps) {
  const { t } = useTranslation()
  const role = useAppSelector((state) => state.auth.user?.role)
  const canAccess = role === 'owner' || role === 'super_admin'
  const validOrgId = Number.isInteger(orgId) && orgId > 0
  const queryKey = ['organizations', orgId, 'camera-relay-settings'] as const

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getCameraRelaySettings(orgId),
    enabled: canAccess && validOrgId,
    retry: false,
  })

  if (!canAccess || !validOrgId) return null

  return (
    <Card variant="borderless" title={t('cameraRelaySettings.title')}>
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : settingsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title={t('cameraRelaySettings.loadError')}
          action={
            <Button size="small" onClick={() => settingsQuery.refetch()}>
              {t('cameraRelaySettings.retry')}
            </Button>
          }
        />
      ) : settingsQuery.data ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <CameraRelayDirectionForm
            direction="entry"
            orgId={orgId}
            settings={settingsQuery.data.entry}
            queryKey={queryKey}
          />
          <CameraRelayDirectionForm
            direction="exit"
            orgId={orgId}
            settings={settingsQuery.data.exit}
            queryKey={queryKey}
          />
        </div>
      ) : null}
    </Card>
  )
}
