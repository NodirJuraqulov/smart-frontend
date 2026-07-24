import { theme as antdTheme } from 'antd'

interface PlateBadgeProps {
  value: string
}

export default function PlateBadge({ value }: PlateBadgeProps) {
  const { token } = antdTheme.useToken()

  return (
    <span
      style={{
        fontFamily: 'ui-monospace, monospace',
        fontWeight: 600,
        letterSpacing: 1,
        padding: '2px 8px',
        borderRadius: token.borderRadiusSM,
        backgroundColor: token.colorFillSecondary,
        border: `1px solid ${token.colorBorder}`,
      }}
    >
      {value}
    </span>
  )
}
