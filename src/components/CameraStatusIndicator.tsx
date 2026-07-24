import { useTranslation } from 'react-i18next'
import { Typography } from 'antd'

interface CameraStatusIndicatorProps {
  status: boolean | null
}

export default function CameraStatusIndicator({
  status,
}: CameraStatusIndicatorProps) {
  const { t } = useTranslation()

  const emoji = status === true ? '🟢' : status === false ? '🔴' : '⚪'
  const label =
    status === true
      ? t('common.cameraStatusWorking')
      : status === false
        ? t('common.cameraStatusDisconnected')
        : t('common.cameraStatusUnknown')

  return (
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {emoji} {label}
    </Typography.Text>
  )
}
