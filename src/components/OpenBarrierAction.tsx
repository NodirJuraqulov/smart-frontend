import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { App as AntdApp, Button, Dropdown } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import { openBarrierForSession } from '@/api/parking'
import { getErrorMessage } from '@/utils/apiError'

interface OpenBarrierActionProps {
  sessionId: number
}

export default function OpenBarrierAction({ sessionId }: OpenBarrierActionProps) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()

  const mutation = useMutation({
    mutationFn: (direction: 'entry' | 'exit') =>
      openBarrierForSession({ id: sessionId, direction }),
    onSuccess: () => {
      message.success(t('operatorDashboard.openBarrierSuccess'))
    },
    onError: (error) => {
      message.error(getErrorMessage(error, t('operatorDashboard.openBarrierError')))
    },
  })

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: [
          {
            key: 'entry',
            label: t('operatorDashboard.openBarrierEntryMenuItem'),
          },
          {
            key: 'exit',
            label: t('operatorDashboard.openBarrierExitMenuItem'),
          },
        ],
        onClick: ({ key }) => mutation.mutate(key as 'entry' | 'exit'),
      }}
    >
      <Button
        size="small"
        icon={<ThunderboltOutlined />}
        loading={mutation.isPending}
      >
        {t('operatorDashboard.openBarrierButton')}
      </Button>
    </Dropdown>
  )
}
