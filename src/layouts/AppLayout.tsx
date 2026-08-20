import { Suspense, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout, type MenuProps } from 'antd'
import { HEADER_HEIGHT } from '@/theme/themeConfig'
import AppSidebar from './components/AppSidebar'
import AppHeader from './components/AppHeader'
import AppFooter from './components/AppFooter'
import ScrollToTopButton from '@/components/ScrollToTopButton'
import PageLoader from '@/components/PageLoader'
import BlacklistAttemptNotifier from './components/BlacklistAttemptNotifier'

const { Content } = Layout

interface AppLayoutProps {
  menuItems: MenuProps['items']
  roleLabel: string
}

export default function AppLayout({ menuItems, roleLabel }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleCollapse = (
    nextCollapsed: boolean,
    type: 'clickTrigger' | 'responsive',
  ) => {
    setCollapsed(nextCollapsed)
    if (type === 'responsive') {
      setIsMobile(nextCollapsed)
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      <BlacklistAttemptNotifier />
      <AppSidebar
        menuItems={menuItems}
        collapsed={collapsed}
        isMobile={isMobile}
        onCollapse={handleCollapse}
      />
      <Layout style={{ height: '100vh' }}>
        <AppHeader
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          roleLabel={roleLabel}
        />
        <Content
          ref={contentRef}
          style={{
            overflow: 'auto',
            height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: '1 0 auto' }}>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
          <AppFooter />
        </Content>
      </Layout>
      <ScrollToTopButton containerRef={contentRef} />
    </Layout>
  )
}
