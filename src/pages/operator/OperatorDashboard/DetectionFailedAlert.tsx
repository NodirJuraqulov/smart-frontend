import { Alert, Button, Card, Image, Space } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { buildMediaUrl } from '@/utils/media'
import type { DetectionType } from '@/types/parking'

interface DetectionFailedAlertProps {
  type: DetectionType
  imageUrl: string
  onManualEntry: () => void
  onClose: () => void
}

export default function DetectionFailedAlert({
  type,
  imageUrl,
  onManualEntry,
  onClose,
}: DetectionFailedAlertProps) {
  const { t } = useTranslation()

  return (
    <Card variant="borderless">
      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        title={
          type === 'entry'
            ? t('operatorDashboard.entryDetectionFailedTitle')
            : t('operatorDashboard.exitDetectionFailedTitle')
        }
        description={
          <div className="flex flex-col gap-3">
            {imageUrl && (
              <Image src={buildMediaUrl(imageUrl)} width={200} alt="" />
            )}
            <Space wrap>
              <Button type="primary" onClick={onManualEntry}>
                {t('operatorDashboard.manualEntryButton')}
              </Button>
              <Button onClick={onClose}>
                {t('operatorDashboard.closeButton')}
              </Button>
            </Space>
          </div>
        }
      />
    </Card>
  )
}
