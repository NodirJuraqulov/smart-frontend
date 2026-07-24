import { theme as antdTheme } from 'antd'
import { useTheme } from '@/contexts/ThemeContext'
import { colorSurface } from '@/theme/palette'

export default function AppFooter() {
  const { mode } = useTheme()
  const { token } = antdTheme.useToken()

  return (
    <div
      className="px-6 py-3 text-xs"
      style={{
        backgroundColor: colorSurface[mode],
        color: token.colorTextTertiary,
        borderTop: `1px solid ${token.colorBorder}`,
      }}
    >
      © {new Date().getFullYear()} AutoStoyanka
    </div>
  )
}
