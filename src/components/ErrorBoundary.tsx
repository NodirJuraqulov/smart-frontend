import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Result } from 'antd'
import i18n from '@/i18n'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Result
            status="error"
            title={i18n.t('errorBoundary.title')}
            subTitle={i18n.t('errorBoundary.subtitle')}
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                {i18n.t('errorBoundary.reload')}
              </Button>
            }
          />
        </div>
      )
    }

    return this.props.children
  }
}
