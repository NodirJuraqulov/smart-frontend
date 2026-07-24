import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Result } from 'antd'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  useDocumentTitle(t('notFound.title'))

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.subtitle')}
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            {t('notFound.backButton')}
          </Button>
        }
      />
    </div>
  )
}
