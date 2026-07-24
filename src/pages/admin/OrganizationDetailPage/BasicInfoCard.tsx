import { Card, Descriptions, Skeleton, Space, Tag, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { getStatusTagStyle } from '@/theme/statusColors'
import { formatDate, formatRelativeTime } from '@/utils/format'
import type { Organization } from '@/types/organization'

interface BasicInfoCardProps {
  organization: Organization
  statsLoading: boolean
  isOnline: boolean
  lastHeartbeatAt: string | null | undefined
}

export default function BasicInfoCard({
  organization,
  statsLoading,
  isOnline,
  lastHeartbeatAt,
}: BasicInfoCardProps) {
  const { t } = useTranslation()
  const { mode } = useTheme()

  return (
    <Card variant="borderless" title={t('orgDetail.basicInfoTitle')}>
      <Descriptions column={{ xs: 1, sm: 2 }}>
        <Descriptions.Item label={t('orgDetail.nameLabel')}>
          {organization.name}
        </Descriptions.Item>
        <Descriptions.Item label={t('orgDetail.addressLabel')}>
          {organization.address || '—'}
        </Descriptions.Item>
        <Descriptions.Item label={t('orgDetail.statusLabel')}>
          <Tag style={getStatusTagStyle(organization.is_active, mode)}>
            {organization.is_active
              ? t('common.statusActive')
              : t('common.statusBlocked')}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('orgDetail.createdAtLabel')}>
          {formatDate(organization.created_at)}
        </Descriptions.Item>
        <Descriptions.Item label={t('orgDetail.connectionStatusLabel')}>
          {statsLoading ? (
            <Skeleton.Button active size="small" />
          ) : (
            <Space orientation="vertical" size={0}>
              <Tag style={getStatusTagStyle(isOnline, mode)}>
                {isOnline
                  ? `🟢 ${t('orgDetail.online')}`
                  : `🔴 ${t('orgDetail.offline')}`}
              </Tag>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {lastHeartbeatAt
                  ? t('orgDetail.lastSeenLabel', {
                      time: formatRelativeTime(lastHeartbeatAt),
                    })
                  : t('orgDetail.neverSeenLabel')}
              </Typography.Text>
            </Space>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}
