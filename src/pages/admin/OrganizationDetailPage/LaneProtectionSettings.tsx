import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Descriptions,
  Form,
  InputNumber,
  Radio,
  Space,
  Typography,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { updateIntegrationSettings } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import type {
  GateLayout,
  IntegrationSettings,
} from '@/types/organization'

interface LaneProtectionFormValues {
  gate_layout: GateLayout
  cross_camera_guard_seconds: number
}

interface LaneProtectionSettingsProps {
  orgId: number
  settings: IntegrationSettings
  queryKey: readonly unknown[]
}

const DEFAULT_GUARD_SECONDS = 90

function normalizeSavedValues(
  settings: IntegrationSettings,
): LaneProtectionFormValues {
  const seconds = Number(settings.cross_camera_guard_seconds)
  return {
    gate_layout:
      settings.gate_layout === 'shared' ? 'shared' : 'separate',
    cross_camera_guard_seconds:
      Number.isInteger(seconds) && seconds >= 5 && seconds <= 300
        ? seconds
        : DEFAULT_GUARD_SECONDS,
  }
}

function normalizeFormValues(
  values: Partial<LaneProtectionFormValues> | undefined,
): Partial<LaneProtectionFormValues> {
  return {
    gate_layout: values?.gate_layout,
    cross_camera_guard_seconds:
      values?.cross_camera_guard_seconds == null
        ? undefined
        : Number(values.cross_camera_guard_seconds),
  }
}

function isValid(values: Partial<LaneProtectionFormValues>): boolean {
  if (values.gate_layout !== 'shared' && values.gate_layout !== 'separate') {
    return false
  }
  const seconds = values.cross_camera_guard_seconds
  return (
    typeof seconds === 'number' &&
    Number.isInteger(seconds) &&
    seconds >= 5 &&
    seconds <= 300
  )
}

export default function LaneProtectionSettings({
  orgId,
  settings,
  queryKey,
}: LaneProtectionSettingsProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [savedValues, setSavedValues] = useState(() =>
    normalizeSavedValues(settings),
  )
  const [form] = Form.useForm<LaneProtectionFormValues>()
  const formValues = Form.useWatch([], form)
  const gateLayout = formValues?.gate_layout
  const previousOrgIdRef = useRef(orgId)
  const isEditingRef = useRef(false)

  const setFormValues = (values: LaneProtectionFormValues) => {
    form.setFields([
      { name: 'gate_layout', value: values.gate_layout, errors: [] },
      {
        name: 'cross_camera_guard_seconds',
        value: values.cross_camera_guard_seconds,
        errors: [],
      },
    ])
  }

  useEffect(() => {
    const nextSavedValues = normalizeSavedValues(settings)
    const organizationChanged = previousOrgIdRef.current !== orgId
    previousOrgIdRef.current = orgId
    setSavedValues(nextSavedValues)

    if (organizationChanged) {
      isEditingRef.current = false
      setIsEditing(false)
      setFormValues(nextSavedValues)
      return
    }

    if (!isEditingRef.current) {
      setFormValues(nextSavedValues)
    }
    // Form edits intentionally survive same-organization background refetches.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, settings])

  const normalizedFormValues = normalizeFormValues(formValues)
  const formIsValid = isValid(normalizedFormValues)
  const isDirty =
    normalizedFormValues.gate_layout !== savedValues.gate_layout ||
    normalizedFormValues.cross_camera_guard_seconds !==
      savedValues.cross_camera_guard_seconds

  const mutation = useMutation({
    mutationFn: (values: LaneProtectionFormValues) =>
      updateIntegrationSettings({
        orgId,
        relay_entry_ip: settings.relay_entry_ip,
        relay_exit_ip: settings.relay_exit_ip,
        printer_ip: settings.printer_ip,
        camera_brand: settings.camera_brand,
        gate_layout: values.gate_layout,
        cross_camera_guard_seconds: values.cross_camera_guard_seconds,
      }),
    onSuccess: (savedSettings) => {
      const nextSavedValues = normalizeSavedValues(savedSettings)
      queryClient.setQueryData(queryKey, savedSettings)
      setSavedValues(nextSavedValues)
      setFormValues(nextSavedValues)
      isEditingRef.current = false
      setIsEditing(false)
      message.success(t('integrationSettings.laneProtectionSaveSuccess'))
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('integrationSettings.laneProtectionSaveError')),
      )
    },
  })

  const openEdit = () => {
    setFormValues(savedValues)
    isEditingRef.current = true
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setFormValues(savedValues)
    isEditingRef.current = false
    setIsEditing(false)
  }

  const handleSubmit = (values: LaneProtectionFormValues) => {
    const normalized = normalizeFormValues(values)
    const changed =
      normalized.gate_layout !== savedValues.gate_layout ||
      normalized.cross_camera_guard_seconds !==
        savedValues.cross_camera_guard_seconds

    if (!changed || !isValid(normalized)) return
    mutation.mutate(normalized as LaneProtectionFormValues)
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Typography.Title level={5} className="m-0!">
          {t('integrationSettings.laneProtectionSectionTitle')}
        </Typography.Title>
        {!isEditing && (
          <Button
            icon={<EditOutlined />}
            onClick={openEdit}
            disabled={mutation.isPending}
          >
            {t('integrationSettings.editButton')}
          </Button>
        )}
      </div>

      {isEditing ? (
        <Form<LaneProtectionFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="gate_layout"
            label={t('integrationSettings.gateLayoutLabel')}
            rules={[
              {
                required: true,
                message: t('integrationSettings.gateLayoutRequired'),
              },
            ]}
          >
            <Radio.Group className="flex flex-col gap-2">
              <Radio value="separate">
                {t('integrationSettings.gateLayoutSeparate')}
              </Radio>
              <Radio value="shared">
                {t('integrationSettings.gateLayoutShared')}
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="cross_camera_guard_seconds"
            label={t('integrationSettings.guardSecondsLabel')}
            dependencies={['gate_layout']}
            extra={
              gateLayout === 'shared'
                ? t('integrationSettings.guardSecondsHelp')
                : undefined
            }
            rules={
              gateLayout === 'shared'
                ? [
                    {
                      required: true,
                      message: t('integrationSettings.guardSecondsRequired'),
                    },
                    {
                      type: 'integer',
                      message: t('integrationSettings.guardSecondsInteger'),
                    },
                    {
                      type: 'number',
                      min: 5,
                      message: t('integrationSettings.guardSecondsMin'),
                    },
                    {
                      type: 'number',
                      max: 300,
                      message: t('integrationSettings.guardSecondsMax'),
                    },
                  ]
                : []
            }
          >
            <InputNumber
              step={1}
              disabled={gateLayout !== 'shared'}
              suffix={t('integrationSettings.secondsSuffix')}
              style={{ width: '100%', maxWidth: 280 }}
            />
          </Form.Item>

          <Alert
            className="mb-4"
            type={gateLayout === 'shared' ? 'info' : 'success'}
            showIcon
            title={t(
              gateLayout === 'shared'
                ? 'integrationSettings.sharedLaneAlert'
                : 'integrationSettings.separateLaneAlert',
            )}
          />

          <Space>
            <Button onClick={cancelEdit} disabled={mutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              disabled={mutation.isPending || !isDirty || !formIsValid}
            >
              {t('common.save')}
            </Button>
          </Space>
        </Form>
      ) : (
        <Descriptions column={1}>
          <Descriptions.Item
            label={t('integrationSettings.gateLayoutLabel')}
          >
            {t(
              savedValues.gate_layout === 'shared'
                ? 'integrationSettings.gateLayoutShared'
                : 'integrationSettings.gateLayoutSeparate',
            )}
          </Descriptions.Item>
          <Descriptions.Item
            label={t('integrationSettings.guardSecondsLabel')}
          >
            {savedValues.gate_layout === 'shared'
              ? `${savedValues.cross_camera_guard_seconds} ${t(
                  'integrationSettings.secondsSuffix',
                )}`
              : t('integrationSettings.protectionDisabledValue')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </section>
  )
}
