import type { CSSProperties } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Layout,
  Menu,
  Popconfirm,
  theme as antdTheme,
  type MenuProps,
} from 'antd'
import { CarOutlined, LogoutOutlined } from '@ant-design/icons'
import { logout as logoutRequest } from '@/api/auth'
import { logout as logoutAction } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/hooks/redux'
import { useTheme } from '@/contexts/ThemeContext'
import { homeRouteForRole } from '@/utils/roleRoute'
import {
  colorBrandAuto,
  colorBrandStoyanka,
  colorSidebarActive,
  palette,
} from '@/theme/palette'
import { HEADER_HEIGHT } from '@/theme/themeConfig'

const { Sider } = Layout

interface AppSidebarProps {
  menuItems: MenuProps['items']
  collapsed: boolean
  isMobile: boolean
  onCollapse: (
    collapsed: boolean,
    type: 'clickTrigger' | 'responsive',
  ) => void
}

export default function AppSidebar({
  menuItems,
  collapsed,
  isMobile,
  onCollapse,
}: AppSidebarProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const refreshToken = useAppSelector((state) => state.auth.refreshToken)
  const role = useAppSelector((state) => state.auth.user?.role)
  const { mode } = useTheme()
  const { token } = antdTheme.useToken()
  const homeRoute = homeRouteForRole(role ?? 'operator')

  const logoutMutation = useMutation({
    mutationFn: () => logoutRequest(refreshToken),
    onSettled: () => {
      dispatch(logoutAction())
      navigate('/login', { replace: true })
    },
  })

  const menuKeys = (menuItems ?? [])
    .map((item) => item?.key)
    .filter((key): key is string => typeof key === 'string')

  const selectedKey =
    menuKeys
      .filter((key) => location.pathname.startsWith(key))
      .sort((a, b) => b.length - a.length)[0] ?? menuKeys[0]

  const siderTextColor = mode === 'dark' ? palette.sidebarText : token.colorText

  return (
    <Sider
      theme={mode}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 64}
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      style={{ height: '100vh' }}
    >
      <div className="flex h-full flex-col">
        <Link
          to={homeRoute}
          className="flex items-center gap-2 text-lg font-bold"
          style={{
            height: HEADER_HEIGHT,
            paddingInline: 16,
            justifyContent: collapsed ? 'center' : 'flex-start',
            flexShrink: 0,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <CarOutlined style={{ fontSize: 24, color: siderTextColor }} />
          {!collapsed && (
            <span>
              <span style={{ color: colorBrandAuto[mode] }}>Auto</span>
              <span style={{ color: colorBrandStoyanka[mode] }}>Stoyanka</span>
            </span>
          )}
        </Link>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          <Menu
            theme={mode}
            mode="inline"
            selectedKeys={selectedKey ? [selectedKey] : []}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </div>
        <Popconfirm
          title={t('common.logoutConfirm')}
          onConfirm={() => logoutMutation.mutate()}
          okText={t('common.logout')}
          cancelText={t('common.cancel')}
        >
          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: collapsed ? 18 : 14 }} />}
            loading={logoutMutation.isPending}
            disabled={logoutMutation.isPending}
            className="sidebar-hover-btn"
            style={
              {
                color: siderTextColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'calc(100% - 16px)',
                margin: 8,
                flexShrink: 0,
                fontSize: 13,
                '--sidebar-hover-bg': colorSidebarActive[mode],
              } as CSSProperties
            }
          >
            {!collapsed && t('common.logout')}
          </Button>
        </Popconfirm>
      </div>
    </Sider>
  )
}
