import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  App as AntdApp,
  Button,
  Form,
  InputNumber,
  Radio,
  Typography,
} from 'antd'
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

export default function LaneProtectionSettings({
  orgId,
  settings,
  queryKey,
}: LaneProtectionSettingsProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<LaneProtectionFormValues>()
  const gateLayout = Form.useWatch('gate_layout', form)

  useEffect(() => {
    form.setFieldsValue({
      gate_layout: settings.gate_layout,
      cross_camera_guard_seconds: settings.cross_camera_guard_seconds,
    })
  }, [form, settings])

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
      queryClient.setQueryData(queryKey, savedSettings)
      message.success(t('integrationSettings.laneProtectionSaveSuccess'))
    },
    onError: (error) => {
      message.error(
        getErrorMessage(error, t('integrationSettings.laneProtectionSaveError')),
      )
    },
  })

  return (
    <section className="flex flex-col gap-3">
      <Typography.Title level={5} className="m-0!">
        {t('integrationSettings.laneProtectionSectionTitle')}
      </Typography.Title>

      <Form<LaneProtectionFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          gate_layout: settings.gate_layout,
          cross_camera_guard_seconds: settings.cross_camera_guard_seconds,
        }}
        onFinish={(values) => mutation.mutate(values)}
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

        <Button
          type="primary"
          htmlType="submit"
          loading={mutation.isPending}
          disabled={mutation.isPending}
        >
          {t('common.save')}
        </Button>
      </Form>
    </section>
  )
}
