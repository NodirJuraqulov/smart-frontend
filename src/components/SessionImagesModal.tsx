import { useState } from 'react'
import { Button, Empty, Modal, Typography } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import AuthenticatedImage from './AuthenticatedImage'
import type { ParkingSession } from '@/types/parking'

type SessionImageSource = Pick<
  ParkingSession,
  | 'plate_number'
  | 'image_entry'
  | 'image_exit'
  | 'entryVehicleImageUrl'
  | 'entryPlateImageUrl'
  | 'exitVehicleImageUrl'
  | 'exitPlateImageUrl'
>

interface SessionImage {
  key: string
  url: string
  labelKey: string
}

function getSessionImages(session: SessionImageSource): SessionImage[] {
  const candidates = [
    {
      key: 'entry-vehicle',
      url: session.entryVehicleImageUrl ?? session.image_entry,
      labelKey: 'sessions.entryVehicleImage',
    },
    {
      key: 'entry-plate',
      url: session.entryPlateImageUrl,
      labelKey: 'sessions.entryPlateImage',
    },
    {
      key: 'exit-vehicle',
      url: session.exitVehicleImageUrl ?? session.image_exit,
      labelKey: 'sessions.exitVehicleImage',
    },
    {
      key: 'exit-plate',
      url: session.exitPlateImageUrl,
      labelKey: 'sessions.exitPlateImage',
    },
  ]

  return candidates.filter(
    (item): item is SessionImage => typeof item.url === 'string' && !!item.url,
  )
}

function hasSessionImages(session: SessionImageSource): boolean {
  return getSessionImages(session).length > 0
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
      {images.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((image) => {
            const label = t(image.labelKey)
            return (
              <section key={image.key} className="min-w-0">
                <Typography.Title level={5}>{label}</Typography.Title>
                <AuthenticatedImage url={image.url} alt={label} />
              </section>
            )
          })}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('sessions.noImages')}
        />
      )}
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
