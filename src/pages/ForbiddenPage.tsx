import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Result } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAppSelector } from '@/hooks/redux'
import { homeRouteForRole } from '@/utils/roleRoute'

export default function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const role = useAppSelector((state) => state.auth.user?.role)
  useDocumentTitle(t('forbidden.title'))

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Result
        status="403"
        title={t('forbidden.title')}
        subTitle={t('forbidden.subtitle')}
        extra={
          <Button
            type="primary"
            onClick={() => navigate(homeRouteForRole(role ?? 'operator'))}
          >
            {t('forbidden.backButton')}
          </Button>
        }
      />
    </div>
  )
}
