import { isAxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Alert, Button, Card, Form, Input, Typography, theme as antdTheme } from 'antd'
import { fetchCurrentUser, login } from '@/api/auth'
import { useAppDispatch } from '@/hooks/redux'
import { setCredentials } from '@/store/authSlice'
import { homeRouteForRole } from '@/utils/roleRoute'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useTheme } from '@/contexts/ThemeContext'
import type { LoginPayload } from '@/types/auth'

const LOGIN_PATTERN = /^[a-zA-Z0-9_]+$/

const LOGIN_BG = {
  light: '/bg-login.png',
  dark: '/dark-bg-login.jpeg',
}

export default function LoginPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('auth.pageTitle'))
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { token } = antdTheme.useToken()
  const { mode } = useTheme()

  const mutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const loginResult = await login(payload)
      localStorage.setItem('accessToken', loginResult.token)
      localStorage.setItem('refreshToken', loginResult.refreshToken)
      const user = await fetchCurrentUser()
      return {
        user,
        token: loginResult.token,
        refreshToken: loginResult.refreshToken,
      }
    },
    onSuccess: (data) => {
      dispatch(setCredentials(data))
      navigate(homeRouteForRole(data.user.role), { replace: true })
    },
  })

  const handleFinish = (values: LoginPayload) => {
    mutation.mutate(values)
  }

  const errorMessage = mutation.isError
    ? isAxiosError(mutation.error) && mutation.error.response?.status === 401
      ? t('auth.invalidCredentials')
      : t('auth.genericError')
    : null

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundColor: token.colorBgLayout,
        backgroundImage: `url(${LOGIN_BG[mode]})`,
      }}
    >
      <Card variant="borderless" className="w-full max-w-sm">
        <Typography.Title level={3} className="mb-6! text-center">
          AutoStoyanka
        </Typography.Title>
        {errorMessage && (
          <Alert type="error" title={errorMessage} showIcon className="mb-4!" />
        )}
        <Form
          layout="vertical"
          onFinish={handleFinish}
          disabled={mutation.isPending}
        >
          <Form.Item
            label={t('auth.loginLabel')}
            name="login"
            rules={[
              { required: true, message: t('auth.loginRequired') },
              { min: 3, message: t('validation.loginMinLength') },
              { pattern: LOGIN_PATTERN, message: t('validation.loginPattern') },
            ]}
          >
            <Input placeholder={t('auth.loginPlaceholder')} autoComplete="username" />
          </Form.Item>
          <Form.Item
            label={t('auth.passwordLabel')}
            name="password"
            rules={[{ required: true, message: t('auth.passwordRequired') }]}
          >
            <Input.Password
              placeholder={t('auth.passwordPlaceholder')}
              autoComplete="current-password"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={mutation.isPending}
              disabled={mutation.isPending}
            >
              {t('auth.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
