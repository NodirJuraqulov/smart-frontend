import { Button, Layout, Typography, theme as antdTheme } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const { Header } = Layout

interface AppHeaderProps {
  collapsed: boolean
  onToggle: () => void
  roleLabel: string
}

export default function AppHeader({
  collapsed,
  onToggle,
  roleLabel,
}: AppHeaderProps) {
  const { token } = antdTheme.useToken()

  return (
    <Header className="flex shrink-0 items-center gap-3 px-6">
      <Button
        size="large"
        icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
        onClick={onToggle}
        style={{
          boxShadow: token.boxShadowTertiary,
          marginLeft: -28,
        }}
      />
      <Typography.Text
        strong
        className="min-w-0 truncate text-base sm:text-lg"
        style={{ color: token.colorText }}
      >
        {roleLabel}
      </Typography.Text>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </Header>
  )
}
