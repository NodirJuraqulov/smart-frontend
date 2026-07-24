import { Button, Modal, theme as antdTheme } from 'antd'
import { useTranslation } from 'react-i18next'
import type { ActivityLog } from '@/types/activityLog'

interface DetailsModalProps {
  log: ActivityLog | null
  onClose: () => void
}

export default function DetailsModal({ log, onClose }: DetailsModalProps) {
  const { t } = useTranslation()
  const { token } = antdTheme.useToken()

  return (
    <Modal
      title={t('activityLog.detailsModalTitle')}
      open={!!log}
      onCancel={onClose}
      footer={<Button onClick={onClose}>{t('common.cancel')}</Button>}
      width={{ xs: '90%', sm: '80%', md: 600 }}
      destroyOnHidden
    >
      <pre
        className="overflow-auto rounded p-3 text-xs"
        style={{
          backgroundColor: token.colorFillTertiary,
          color: token.colorText,
          maxHeight: 400,
        }}
      >
        {JSON.stringify(log?.details, null, 2)}
      </pre>
    </Modal>
  )
}
