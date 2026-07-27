import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Skeleton,
  Space,
  Switch,
  TimePicker,
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { getSettings, updateSettings } from '@/api/settings'
import { getErrorMessage } from '@/utils/apiError'
import type { UpdateSettingsPayload } from '@/types/settings'

interface SettingsFormValues {
  work_hours_enabled: boolean
  work_time_range?: [Dayjs, Dayjs] | null
}

interface SettingsCardProps {
  orgId: number
}

export default function SettingsCard({ orgId }: SettingsCardProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [workHoursEnabled, setWorkHoursEnabled] = useState(false)
  const [form] = Form.useForm<SettingsFormValues>()

  const queryKey = ['org-settings', orgId]

  const settingsQuery = useQuery({
    queryKey,
    queryFn: () => getSettings(orgId),
    enabled: !!orgId,
    retry: false,
  })

  const mutation = useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(orgId, payload),
    onSuccess: () => {
      message.success(t('orgDetail.settingsSaveSuccess'))
      queryClient.invalidateQueries({ queryKey })
      setIsEditing(false)
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('orgDetail.settingsSaveError')))
    },
  })

  const data = settingsQuery.data

  const openEdit = () => {
    form.setFieldsValue({
      work_hours_enabled: data?.work_hours_enabled ?? false,
      work_time_range:
        data?.work_start && data?.work_end
          ? [dayjs(data.work_start, 'HH:mm'), dayjs(data.work_end, 'HH:mm')]
          : undefined,
    })
    setWorkHoursEnabled(data?.work_hours_enabled ?? false)
    setIsEditing(true)
  }

  const handleSubmit = (values: SettingsFormValues) => {
    const payload: UpdateSettingsPayload = {
      work_hours_enabled: values.work_hours_enabled,
    }

    if (values.work_hours_enabled && values.work_time_range) {
      payload.work_start = values.work_time_range[0].format('HH:mm')
      payload.work_end = values.work_time_range[1].format('HH:mm')
    }

    mutation.mutate(payload)
  }

  return (
    <Card
      variant="borderless"
      title={t('orgDetail.settingsTitle')}
      extra={
        !isEditing &&
        data && (
          <Button icon={<EditOutlined />} onClick={openEdit}>
            {t('orgDetail.settingsEditButton')}
          </Button>
        )
      }
    >
      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : !data ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('orgDetail.settingsEmpty')}
        />
      ) : isEditing ? (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label={t('orgDetail.workHoursEnabledLabel')}
            name="work_hours_enabled"
            valuePropName="checked"
          >
            <Switch onChange={setWorkHoursEnabled} />
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
          </Form.Item>
        </Form>
      ) : (
        <Descriptions column={1}>
          <Descriptions.Item label={t('orgDetail.workHoursEnabledLabel')}>
            {data.work_hours_enabled
              ? `${data.work_start ?? '—'} – ${data.work_end ?? '—'}`
              : t('orgDetail.workHoursUnrestricted')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  )
}
