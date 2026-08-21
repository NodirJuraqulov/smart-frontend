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
  Skeleton,
  Space,
  Tag,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  getTelegramSettings,
  updateTelegramSettings,
} from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import type { TelegramSettings } from '@/types/organization'

interface TelegramSettingsCardProps {
  orgId: number
}

interface TelegramSettingsFormValues {
  telegram_bot_token?: string
  telegram_chat_ids: string[]
}

const BOT_TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]+$/
const CHAT_ID_PATTERN = /^-?\d+$/

function formValuesFromSettings(
  settings: TelegramSettings,
): TelegramSettingsFormValues {
  return {
    telegram_bot_token: '',
    telegram_chat_ids:
      settings.telegram_chat_ids.length > 0
        ? [...settings.telegram_chat_ids]
        : [''],
  }
}

export default function TelegramSettingsCard({
  orgId,
}: TelegramSettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<TelegramSettingsFormValues>()
  const [isEditing, setIsEditing] = useState(false)
  const validOrgId = Number.isInteger(orgId) && orgId > 0
  const queryKey = ['organizations', orgId, 'telegram-settings'] as const

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getTelegramSettings(orgId),
    enabled: validOrgId,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (formValues: TelegramSettingsFormValues) => {
      const token = formValues.telegram_bot_token?.trim()
      return updateTelegramSettings({
        orgId,
        telegram_chat_ids: formValues.telegram_chat_ids.map((chatId) =>
          chatId.trim(),
        ),
        ...(token ? { telegram_bot_token: token } : {}),
      })
    },
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(queryKey, savedSettings)
      setIsEditing(false)
      message.success(t('telegramSettings.saveSuccess'))
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('telegramSettings.saveError')))
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
      title={t('telegramSettings.title')}
      data-testid="telegram-settings-card"
      extra={
        settings ? (
          <Space>
            <Tag color={settings.telegram_bot_configured ? 'success' : 'default'}>
              {t(
                settings.telegram_bot_configured
                  ? 'telegramSettings.configured'
                  : 'telegramSettings.notConfigured',
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
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : settingsQuery.isError ? (
        <Alert
          type="error"
          showIcon
          title={t('telegramSettings.loadError')}
          action={
            <Button size="small" onClick={() => settingsQuery.refetch()}>
              {t('telegramSettings.retry')}
            </Button>
          }
        />
      ) : settings ? (
        !isEditing ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('telegramSettings.botTokenLabel')}>
              {t(
                settings.telegram_bot_configured
                  ? 'telegramSettings.configured'
                  : 'telegramSettings.notConfigured',
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('telegramSettings.chatIdsLabel')}>
              {settings.telegram_chat_ids.length > 0 ? (
                <Space size={[4, 4]} wrap>
                  {settings.telegram_chat_ids.map((chatId) => (
                    <Tag key={chatId}>{chatId}</Tag>
                  ))}
                </Space>
              ) : (
                t('telegramSettings.notConfigured')
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Form<TelegramSettingsFormValues>
            form={form}
            name="telegram-settings"
            layout="vertical"
            initialValues={formValuesFromSettings(settings)}
            onFinish={(formValues) => mutation.mutate(formValues)}
          >
            <Form.Item
              name="telegram_bot_token"
              label={t('telegramSettings.botTokenLabel')}
              extra={
                settings.telegram_bot_configured
                  ? t('telegramSettings.botTokenPreserveHint')
                  : undefined
              }
              rules={[
                {
                  validator: (_, value: string | undefined) => {
                    const token = value?.trim()
                    if (!token || BOT_TOKEN_PATTERN.test(token)) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      new Error(t('telegramSettings.botTokenInvalid')),
                    )
                  },
                },
              ]}
            >
              <Input.Password
                autoComplete="new-password"
                placeholder={t('telegramSettings.botTokenPlaceholder')}
              />
            </Form.Item>

            <Form.Item label={t('telegramSettings.chatIdsLabel')} required>
              <Form.List
                name="telegram_chat_ids"
                rules={[
                  {
                    validator: async (_, chatIds: string[] | undefined) => {
                      if (!chatIds?.length) {
                        throw new Error(t('telegramSettings.chatIdsRequired'))
                      }
                    },
                  },
                ]}
              >
                {(fields, { add, remove }, { errors }) => (
                  <Space orientation="vertical" className="w-full">
                    {fields.map(({ key, name, ...restField }, index) => (
                      <div className="flex items-start gap-2" key={key}>
                        <Form.Item
                          {...restField}
                          name={name}
                          className="mb-0 flex-1"
                          rules={[
                            {
                              required: true,
                              whitespace: true,
                              message: t('telegramSettings.chatIdRequired'),
                            },
                            {
                              pattern: CHAT_ID_PATTERN,
                              transform: (value: string) => value?.trim(),
                              message: t('telegramSettings.chatIdInvalid'),
                            },
                          ]}
                        >
                          <Input
                            autoComplete="off"
                            aria-label={t('telegramSettings.chatIdInputLabel', {
                              number: index + 1,
                            })}
                            placeholder={t(
                              'telegramSettings.chatIdPlaceholder',
                            )}
                          />
                        </Form.Item>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          aria-label={t(
                            'telegramSettings.removeChatIdLabel',
                            { number: index + 1 },
                          )}
                          onClick={() => remove(name)}
                        >
                          {t('telegramSettings.removeChatId')}
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      aria-label={t('telegramSettings.addChatId')}
                      onClick={() => add('')}
                    >
                      {t('telegramSettings.addChatId')}
                    </Button>
                    <Form.ErrorList errors={errors} />
                  </Space>
                )}
              </Form.List>
            </Form.Item>

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={mutation.isPending}
                disabled={mutation.isPending}
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
