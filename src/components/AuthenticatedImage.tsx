import { useEffect, useState, type CSSProperties } from 'react'
import { Image, Skeleton, Typography } from 'antd'
import { PictureOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { axiosInstance } from '@/api/axiosInstance'

interface AuthenticatedImageProps {
  url: string | null | undefined
  alt: string
  style?: CSSProperties
  className?: string
  preview?: boolean
}

type LoadState =
  | { status: 'idle'; objectUrl: null }
  | { status: 'loading'; objectUrl: null }
  | { status: 'loaded'; objectUrl: string }
  | { status: 'error'; objectUrl: null }

export default function AuthenticatedImage({
  url,
  alt,
  style,
  className,
  preview = true,
}: AuthenticatedImageProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<LoadState>({
    status: 'idle',
    objectUrl: null,
  })

  useEffect(() => {
    if (!url) {
      setState({ status: 'idle', objectUrl: null })
      return
    }

    const controller = new AbortController()
    let objectUrl: string | null = null

    setState({ status: 'loading', objectUrl: null })

    axiosInstance
      .get<Blob>(url, {
        responseType: 'blob',
        signal: controller.signal,
      })
      .then((response) => {
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(response.data)
        setState({ status: 'loaded', objectUrl })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error', objectUrl: null })
        }
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  if (!url) {
    return (
      <div className={className} style={style}>
        <Typography.Text type="secondary">
          {alt}
        </Typography.Text>
      </div>
    )
  }

  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <Skeleton.Image
        active
        className={className}
        style={{ width: '100%', height: 180, ...style }}
        aria-label={alt}
      />
    )
  }

  if (state.status === 'error') {
    return (
      <div
        className={`flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-4 ${className ?? ''}`}
        style={style}
        role="status"
      >
        <PictureOutlined style={{ fontSize: 28 }} />
        <Typography.Text type="secondary">
          {t('sessions.imageLoadError', { label: alt })}
        </Typography.Text>
      </div>
    )
  }

  return (
    <Image
      src={state.objectUrl}
      alt={alt}
      className={className}
      preview={preview}
      style={{
        width: '100%',
        maxHeight: 360,
        objectFit: 'contain',
        ...style,
      }}
    />
  )
}
