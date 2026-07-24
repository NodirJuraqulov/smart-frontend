import { useEffect, useState, type RefObject } from 'react'
import { Button, theme as antdTheme } from 'antd'
import { UpOutlined } from '@ant-design/icons'

const SCROLL_THRESHOLD = 300

interface ScrollToTopButtonProps {
  containerRef: RefObject<HTMLElement | null>
}

export default function ScrollToTopButton({
  containerRef,
}: ScrollToTopButtonProps) {
  const { token } = antdTheme.useToken()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setVisible(container.scrollTop > SCROLL_THRESHOLD)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  if (!visible) return null

  return (
    <Button
      shape="circle"
      size="large"
      icon={<UpOutlined />}
      onClick={() =>
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      }
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        boxShadow: token.boxShadowSecondary,
        zIndex: 1000,
      }}
    />
  )
}
