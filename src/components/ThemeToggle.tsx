import { Button } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useTheme } from '@/contexts/ThemeContext'

export default function ThemeToggle() {
  const { mode, toggleTheme } = useTheme()

  return (
    <Button
      type="text"
      size="large"
      icon={
        mode === 'dark' ? (
          <SunOutlined style={{ fontSize: 20 }} />
        ) : (
          <MoonOutlined style={{ fontSize: 20 }} />
        )
      }
      onClick={toggleTheme}
    />
  )
}
