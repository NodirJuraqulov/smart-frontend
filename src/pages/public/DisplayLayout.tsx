import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Typography, theme as antdTheme } from 'antd'

interface DisplayLayoutProps {
  orgName?: string
  isConnected: boolean
  children: ReactNode
}

export default function DisplayLayout({
  orgName,
  isConnected,
  children,
}: DisplayLayoutProps) {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-10 p-8 text-center"
      style={{ backgroundColor: token.colorBgLayout, color: token.colorText }}
    >
      {orgName && (
        <Typography.Text
          style={{ fontSize: 28, opacity: 0.7, fontWeight: 600 }}
        >
          {orgName}
        </Typography.Text>
      )}

      <div className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-8">
        {children}
      </div>

      {!isConnected && (
        <Typography.Text
          type="warning"
          style={{
            position: 'fixed',
            bottom: 16,
            left: 0,
            right: 0,
            fontSize: 14,
          }}
        >
          {t('publicDisplay.disconnected')}
        </Typography.Text>
      )}
    </div>
  )
}
