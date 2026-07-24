import { useState } from 'react'
import { Image } from 'antd'

export function useSharedImagePreview() {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  const previewElement = (
    <Image
      style={{
        position: 'fixed',
        width: 0,
        height: 0,
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
      src={previewSrc ?? ''}
      preview={{
        visible: !!previewSrc,
        src: previewSrc ?? undefined,
        getContainer: () => document.body,
        onVisibleChange: (visible) => {
          if (!visible) setPreviewSrc(null)
        },
      }}
    />
  )

  return { setPreviewSrc, previewElement }
}
