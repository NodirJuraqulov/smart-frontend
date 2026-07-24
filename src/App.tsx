import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider, Spin } from 'antd'
import { store } from './store/store'
import AppRoutes from './routes/AppRoutes'
import { useAuthBootstrap } from './hooks/useAuthBootstrap'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { buildThemeConfig } from './theme/themeConfig'
import MessageApiBridge from './components/MessageApiBridge'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient()

function AppGate() {
  const { isBootstrapping } = useAuthBootstrap()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return <AppRoutes />
}

function ThemedApp() {
  const { mode } = useTheme()

  return (
    <ConfigProvider theme={buildThemeConfig(mode)}>
      <AntApp>
        <MessageApiBridge />
        <BrowserRouter>
          <ErrorBoundary>
            <AppGate />
          </ErrorBoundary>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  )
}
