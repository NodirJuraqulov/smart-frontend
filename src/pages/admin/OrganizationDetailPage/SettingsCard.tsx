import {
  Button,
  Card,
  Empty,
  Form,
  Skeleton,
  Switch,
  TimePicker,
  type FormInstance,
} from 'antd'
import { useTranslation } from 'react-i18next'
import type { Dayjs } from 'dayjs'
import type { OrgSettings } from '@/types/settings'

export interface SettingsFormValues {
  work_hours_enabled: boolean
  work_time_range?: [Dayjs, Dayjs] | null
}

interface SettingsCardProps {
  isLoading: boolean
  data: OrgSettings | undefined
  form: FormInstance<SettingsFormValues>
  workHoursEnabled: boolean | undefined
  onSubmit: (values: SettingsFormValues) => void
  isSaving: boolean
}

export default function SettingsCard({
  isLoading,
  data,
  form,
  workHoursEnabled,
  onSubmit,
  isSaving,
}: SettingsCardProps) {
  const { t } = useTranslation()

  return (
    <Card variant="borderless" title={t('orgDetail.settingsTitle')}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : data ? (
        <Form form={form} layout="vertical" onFinish={onSubmit}>
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
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('orgDetail.settingsEmpty')}
        />
      )}
    </Card>
  )
}
