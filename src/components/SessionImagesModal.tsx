import { useState } from 'react'
import { Button, Empty, Modal, Typography } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import AuthenticatedImage from './AuthenticatedImage'
import type { ParkingSession } from '@/types/parking'

type SessionImageSource = Pick<
  ParkingSession,
  | 'plate_number'
  | 'entryOverviewImageUrl'
  | 'exitOverviewImageUrl'
  | 'entryVehicleImageUrl'
  | 'exitVehicleImageUrl'
>

interface SessionImage {
  key: string
  url: string
  labelKey: string
}

function getSessionImages(session: SessionImageSource): SessionImage[] {
  return [
    {
      key: 'entry-vehicle',
      url: session.entryOverviewImageUrl ?? session.entryVehicleImageUrl,
      labelKey: 'sessions.entryVehicleImage',
    },
    {
      key: 'exit-vehicle',
      url: session.exitOverviewImageUrl ?? session.exitVehicleImageUrl,
      labelKey: 'sessions.exitVehicleImage',
    },
  ].map((item) => ({ ...item, url: item.url ?? '' }))
}

function hasSessionImages(session: SessionImageSource): boolean {
  return getSessionImages(session).some((image) => Boolean(image.url))
}

interface SessionImagesModalProps {
  session: SessionImageSource | null
  open: boolean
  onClose: () => void
}

export function SessionImagesModal({
  session,
  open,
  onClose,
}: SessionImagesModalProps) {
  const { t } = useTranslation()
  const images = session ? getSessionImages(session) : []

  return (
    <Modal
      open={open}
      title={t('sessions.imagesModalTitle', {
        plate: session?.plate_number ?? '',
      })}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <div
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        data-testid="session-vehicle-images-grid"
      >
        {images.map((image) => {
          const label = t(image.labelKey)
          return (
            <section key={image.key} className="min-w-0">
              <Typography.Title level={5}>{label}</Typography.Title>
              {image.url ? (
                <AuthenticatedImage url={image.url} alt={label} />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('sessions.noImages')}
                />
              )}
            </section>
          )
        })}
      </div>
    </Modal>
  )
}

interface SessionImagesActionProps {
  session: SessionImageSource
  showEmpty?: boolean
}

export function SessionImagesAction({
  session,
  showEmpty = true,
}: SessionImagesActionProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const hasImages = hasSessionImages(session)

  if (!hasImages) {
    return showEmpty ? (
      <Typography.Text type="secondary">
        {t('sessions.noImages')}
      </Typography.Text>
    ) : null
  }

  return (
    <>
      <Button
        size="small"
        icon={<EyeOutlined />}
        aria-label={t('sessions.viewImages')}
        onClick={() => setOpen(true)}
      >
        {t('sessions.viewImages')}
      </Button>
      <SessionImagesModal
        session={session}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
