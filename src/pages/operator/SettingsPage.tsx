import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Descriptions, Empty, Skeleton, Space, Tag, Typography } from 'antd'
import { getSettings } from '@/api/settings'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import CameraStatusIndicator from '@/components/CameraStatusIndicator'

export default function OperatorSettingsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('operatorSettings.title'))
  const { mode } = useTheme()

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(),
    retry: false,
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <Typography.Title level={3} className="m-0!">
        {t('operatorSettings.title')}
      </Typography.Title>

      <Card variant="borderless">
        {settingsQuery.isLoading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : settingsQuery.data ? (
          <Descriptions column={{ xs: 1, sm: 2 }}>
            {settingsQuery.data.camera_entry_url && (
              <Descriptions.Item label={t('operatorSettings.entryCameraUrlLabel')}>
                <Space size={4}>
                  <span>{settingsQuery.data.camera_entry_url}</span>
                  <CameraStatusIndicator
                    status={settingsQuery.data.last_camera_entry_ok}
                  />
                </Space>
              </Descriptions.Item>
            )}
            {settingsQuery.data.camera_exit_url && (
              <Descriptions.Item label={t('operatorSettings.exitCameraUrlLabel')}>
                <Space size={4}>
                  <span>{settingsQuery.data.camera_exit_url}</span>
                  <CameraStatusIndicator
                    status={settingsQuery.data.last_camera_exit_ok}
                  />
                </Space>
              </Descriptions.Item>
            )}
            {settingsQuery.data.camera_username && (
              <Descriptions.Item label={t('operatorSettings.cameraUsernameLabel')}>
                {settingsQuery.data.camera_username}
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('operatorSettings.cameraAuthLabel')}>
              <Tag
                style={getStatusTagStyle(
                  !!settingsQuery.data.camera_password_configured,
                  mode,
                )}
              >
                {settingsQuery.data.camera_password_configured
                  ? t('operatorSettings.cameraAuthConfigured')
                  : t('operatorSettings.cameraAuthNotConfigured')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('operatorSettings.barrierStatusLabel')}>
              <Tag style={getStatusTagStyle(settingsQuery.data.barrier_enabled, mode)}>
                {settingsQuery.data.barrier_enabled
                  ? t('operatorSettings.barrierConnected')
                  : t('operatorSettings.barrierDisconnected')}
              </Tag>
            </Descriptions.Item>
            {settingsQuery.data.barrier_enabled && (
              <Descriptions.Item label={t('operatorSettings.barrierModeLabel')}>
                {settingsQuery.data.barrier_mode === 'separate'
                  ? t('operatorSettings.barrierModeSeparate')
                  : t('operatorSettings.barrierModeSingle')}
              </Descriptions.Item>
            )}
            {settingsQuery.data.barrier_enabled &&
              (settingsQuery.data.barrier_mode === 'separate' ? (
                <>
                  <Descriptions.Item
                    label={t('operatorSettings.barrierEntryPortLabel')}
                  >
                    {settingsQuery.data.barrier_entry_port || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={t('operatorSettings.barrierExitPortLabel')}
                  >
                    {settingsQuery.data.barrier_exit_port || '—'}
                  </Descriptions.Item>
                </>
              ) : (
                <Descriptions.Item label={t('operatorSettings.barrierPortLabel')}>
                  {settingsQuery.data.barrier_entry_port || '—'}
                </Descriptions.Item>
              ))}
            <Descriptions.Item label={t('operatorSettings.workHoursLabel')}>
              {settingsQuery.data.work_hours_enabled
                ? `${settingsQuery.data.work_start ?? '—'} – ${settingsQuery.data.work_end ?? '—'}`
                : t('operatorSettings.workHoursUnrestricted')}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('operatorSettings.emptyState')}
          />
        )}
      </Card>
    </div>
  )
}
