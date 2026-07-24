import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Row,
  Skeleton,
  Space,
  Switch,
  TimePicker,
  Typography,
  type FormInstance,
} from 'antd'
import {
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { Dayjs } from 'dayjs'
import CameraStatusIndicator from '@/components/CameraStatusIndicator'
import type { OrgSettings } from '@/types/settings'

export interface SettingsFormValues {
  camera_entry_url?: string
  camera_exit_url?: string
  camera_username?: string
  camera_password?: string
  barrier_enabled: boolean
  barrier_mode: 'single' | 'separate'
  barrier_port?: string
  barrier_entry_port?: string
  barrier_exit_port?: string
  barrier_open_seconds?: number
  work_hours_enabled: boolean
  work_time_range?: [Dayjs, Dayjs] | null
}

interface SettingsCardProps {
  isLoading: boolean
  data: OrgSettings | undefined
  form: FormInstance<SettingsFormValues>
  barrierEnabled: boolean | undefined
  barrierMode: 'single' | 'separate' | undefined
  workHoursEnabled: boolean | undefined
  onSubmit: (values: SettingsFormValues) => void
  isSaving: boolean
  onTestBarrier: (type: 'entry' | 'exit') => void
  isTestingBarrier: boolean
  testingBarrierType: 'entry' | 'exit' | undefined
  showApiKey: boolean
  onToggleShowApiKey: () => void
  onCopyApiKey: (key: string) => void
  onGenerateApiKey: () => void
  isGeneratingApiKey: boolean
}

export default function SettingsCard({
  isLoading,
  data,
  form,
  barrierEnabled,
  barrierMode,
  workHoursEnabled,
  onSubmit,
  isSaving,
  onTestBarrier,
  isTestingBarrier,
  testingBarrierType,
  showApiKey,
  onToggleShowApiKey,
  onCopyApiKey,
  onGenerateApiKey,
  isGeneratingApiKey,
}: SettingsCardProps) {
  const { t } = useTranslation()

  return (
    <Card variant="borderless" title={t('orgDetail.settingsTitle')}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : data ? (
        <>
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space size={4}>
                      <span>{t('orgDetail.entryCameraUrlLabel')}</span>
                      <CameraStatusIndicator status={data.last_camera_entry_ok} />
                    </Space>
                  }
                  name="camera_entry_url"
                >
                  <Input placeholder={t('orgDetail.cameraUrlPlaceholder')} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space size={4}>
                      <span>{t('orgDetail.exitCameraUrlLabel')}</span>
                      <CameraStatusIndicator status={data.last_camera_exit_ok} />
                    </Space>
                  }
                  name="camera_exit_url"
                >
                  <Input placeholder={t('orgDetail.cameraUrlPlaceholder')} />
                </Form.Item>
              </Col>
            </Row>

            <Typography.Title level={5}>
              {t('orgDetail.cameraAuthTitle')}
            </Typography.Title>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('orgDetail.cameraUsernameLabel')}
                  name="camera_username"
                >
                  <Input
                    placeholder={t('orgDetail.cameraUsernamePlaceholder')}
                    autoComplete="off"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label={t('orgDetail.cameraPasswordLabel')}
                  name="camera_password"
                >
                  <Input.Password
                    placeholder={
                      data.camera_password_configured
                        ? t('orgDetail.cameraPasswordConfiguredPlaceholder')
                        : t('orgDetail.cameraPasswordPlaceholder')
                    }
                    autoComplete="new-password"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={t('orgDetail.barrierEnabledLabel')}
              name="barrier_enabled"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            {barrierEnabled && (
              <Form.Item
                label={t('orgDetail.barrierModeLabel')}
                name="barrier_mode"
              >
                <Radio.Group
                  optionType="button"
                  buttonStyle="solid"
                  options={[
                    { label: t('orgDetail.barrierModeSingle'), value: 'single' },
                    {
                      label: t('orgDetail.barrierModeSeparate'),
                      value: 'separate',
                    },
                  ]}
                />
              </Form.Item>
            )}

            {barrierEnabled && barrierMode === 'separate' ? (
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('orgDetail.barrierEntryPortLabel')}
                    name="barrier_entry_port"
                  >
                    <Input placeholder="COM3" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('orgDetail.barrierExitPortLabel')}
                    name="barrier_exit_port"
                  >
                    <Input placeholder="COM4" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('orgDetail.barrierOpenSecondsLabel')}
                    name="barrier_open_seconds"
                    rules={[
                      {
                        type: 'number',
                        min: 1,
                        max: 10,
                        message: t('orgDetail.barrierOpenSecondsValidation'),
                      },
                    ]}
                  >
                    <InputNumber className="w-full" min={1} max={10} />
                  </Form.Item>
                </Col>
              </Row>
            ) : (
              barrierEnabled && (
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('orgDetail.barrierPortLabel')}
                      name="barrier_port"
                    >
                      <Input placeholder="COM3" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('orgDetail.barrierOpenSecondsLabel')}
                      name="barrier_open_seconds"
                      rules={[
                        {
                          type: 'number',
                          min: 1,
                          max: 10,
                          message: t('orgDetail.barrierOpenSecondsValidation'),
                        },
                      ]}
                    >
                      <InputNumber className="w-full" min={1} max={10} />
                    </Form.Item>
                  </Col>
                </Row>
              )
            )}

            {barrierEnabled && (
              <Form.Item>
                {barrierMode === 'separate' ? (
                  <Space wrap>
                    <Button
                      icon={<ThunderboltOutlined />}
                      loading={isTestingBarrier && testingBarrierType === 'entry'}
                      disabled={isTestingBarrier && testingBarrierType !== 'entry'}
                      onClick={() => onTestBarrier('entry')}
                    >
                      {t('orgDetail.barrierTestEntryButton')}
                    </Button>
                    <Button
                      icon={<ThunderboltOutlined />}
                      loading={isTestingBarrier && testingBarrierType === 'exit'}
                      disabled={isTestingBarrier && testingBarrierType !== 'exit'}
                      onClick={() => onTestBarrier('exit')}
                    >
                      {t('orgDetail.barrierTestExitButton')}
                    </Button>
                  </Space>
                ) : (
                  <Button
                    icon={<ThunderboltOutlined />}
                    loading={isTestingBarrier}
                    disabled={isTestingBarrier}
                    onClick={() => onTestBarrier('entry')}
                  >
                    {t('orgDetail.barrierTestButton')}
                  </Button>
                )}
              </Form.Item>
            )}

            <Form.Item
              label={t('orgDetail.workHoursEnabledLabel')}
              name="work_hours_enabled"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            {workHoursEnabled && (
              <Form.Item
                label={t('orgDetail.workHoursRangeLabel')}
                name="work_time_range"
                rules={[
                  {
                    validator: (_, value?: [Dayjs, Dayjs] | null) => {
                      if (!value?.[0] || !value?.[1]) return Promise.resolve()
                      if (!value[0].isBefore(value[1])) {
                        return Promise.reject(
                          new Error(t('orgDetail.workHoursRangeInvalid')),
                        )
                      }
                      return Promise.resolve()
                    },
                  },
                ]}
              >
                <TimePicker.RangePicker format="HH:mm" />
              </Form.Item>
            )}

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={isSaving}
                disabled={isSaving}
              >
                {t('common.save')}
              </Button>
            </Form.Item>
          </Form>

          <Divider />

          <div className="flex flex-col gap-2">
            <Typography.Text strong>
              {t('orgDetail.agentApiKeyLabel')}
            </Typography.Text>
            {data.agent_api_key ? (
              <Space wrap>
                <Typography.Text code>
                  {showApiKey
                    ? data.agent_api_key
                    : `••••••••${data.agent_api_key.slice(-4)}`}
                </Typography.Text>
                <Button
                  size="small"
                  icon={showApiKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={onToggleShowApiKey}
                >
                  {showApiKey
                    ? t('orgDetail.agentApiKeyHide')
                    : t('orgDetail.agentApiKeyShow')}
                </Button>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => onCopyApiKey(data.agent_api_key!)}
                >
                  {t('orgDetail.agentApiKeyCopy')}
                </Button>
                <Popconfirm
                  title={t('orgDetail.agentApiKeyRegenerateConfirmTitle')}
                  onConfirm={onGenerateApiKey}
                  okText={t('orgDetail.agentApiKeyRegenerateConfirmOk')}
                  cancelText={t('common.cancel')}
                >
                  <Button
                    size="small"
                    danger
                    icon={<KeyOutlined />}
                    loading={isGeneratingApiKey}
                  >
                    {t('orgDetail.agentApiKeyGenerate')}
                  </Button>
                </Popconfirm>
              </Space>
            ) : (
              <Space wrap>
                <Typography.Text type="secondary">
                  {t('orgDetail.agentApiKeyNotGenerated')}
                </Typography.Text>
                <Button
                  size="small"
                  icon={<KeyOutlined />}
                  loading={isGeneratingApiKey}
                  onClick={onGenerateApiKey}
                >
                  {t('orgDetail.agentApiKeyGenerate')}
                </Button>
              </Space>
            )}
          </div>
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('orgDetail.settingsEmpty')}
        />
      )}
    </Card>
  )
}
