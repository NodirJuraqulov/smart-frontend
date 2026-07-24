import { Alert, Card, Skeleton, Spin, Typography, theme as antdTheme } from 'antd'
import { useTranslation } from 'react-i18next'
import { VideoCameraOutlined } from '@ant-design/icons'
import { useMjpegStream } from '@/hooks/useMjpegStream'

function buildLiveViewUrl(orgId: number, type: 'entry' | 'exit'): string {
  return `${import.meta.env.VITE_API_URL}/api/live-view?org_id=${orgId}&type=${type}`
}

function CameraDisconnectedPlaceholder() {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()

  return (
    <div className="flex flex-col items-center gap-2">
      <VideoCameraOutlined
        style={{ fontSize: 32, color: token.colorTextTertiary }}
      />
      <Typography.Text type="secondary">
        {t('operatorDashboard.cameraDisconnected')}
      </Typography.Text>
    </div>
  )
}

function CameraFeed({
  orgId,
  type,
  alt,
}: {
  orgId: number
  type: 'entry' | 'exit'
  alt: string
}) {
  const { token } = antdTheme.useToken()
  const { src, hasError } = useMjpegStream(buildLiveViewUrl(orgId, type))

  return (
    <div
      className="mx-auto flex w-full items-center justify-center overflow-hidden"
      style={{
        maxWidth: 640,
        minHeight: 180,
        aspectRatio: '16 / 9',
        backgroundColor: token.colorFillTertiary,
        borderRadius: token.borderRadiusLG,
      }}
    >
      {hasError ? (
        <CameraDisconnectedPlaceholder />
      ) : !src ? (
        <Spin />
      ) : (
        <img
          src={src}
          alt={alt}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  )
}

interface CameraCardProps {
  title: string
  isLoading: boolean
  isError: boolean
  cameraUrl: string | null | undefined
  orgId: number | undefined
  type: 'entry' | 'exit'
  highlighted?: boolean
}

export default function CameraCard({
  title,
  isLoading,
  isError,
  cameraUrl,
  orgId,
  type,
  highlighted,
}: CameraCardProps) {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()

  const highlightStyle = highlighted
    ? { border: `2px solid ${token.colorWarning}` }
    : undefined

  if (isLoading) {
    return (
      <Card variant="borderless" title={title}>
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    )
  }

  if (isError) {
    return (
      <Alert
        type="warning"
        showIcon
        title={t('operatorDashboard.cameraLoadErrorTitle')}
        description={t('operatorDashboard.cameraLoadErrorDescription')}
      />
    )
  }

  if (!cameraUrl || orgId == null) {
    return (
      <Alert
        type="info"
        showIcon
        title={t('operatorDashboard.cameraNotConfiguredTitle')}
        description={t('operatorDashboard.cameraNotConfiguredDescription')}
      />
    )
  }

  return (
    <Card variant="borderless" title={title} style={highlightStyle}>
      <CameraFeed orgId={orgId} type={type} alt={title} />
    </Card>
  )
}
