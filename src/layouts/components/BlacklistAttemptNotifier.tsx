import { useEffect } from 'react'
import { App as AntdApp } from 'antd'
import { useTranslation } from 'react-i18next'
import { acquireSocket, releaseSocket } from '@/services/socket'
import { useAppSelector } from '@/hooks/redux'
import { isBlacklistAttemptEvent } from '@/types/blacklist'

export default function BlacklistAttemptNotifier() {
  const { t } = useTranslation()
  const { notification } = AntdApp.useApp()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const role = useAppSelector((state) => state.auth.user?.role)

  useEffect(() => {
    if (
      !accessToken ||
      (role !== 'operator' && role !== 'owner' && role !== 'kassir')
    ) {
      return
    }

    const socket = acquireSocket()
    const handleBlacklistAttempt = (payload: unknown) => {
      if (!isBlacklistAttemptEvent(payload)) return
      notification.warning({
        message: t('blacklist.notificationTitle'),
        description: t('blacklist.notificationDescription', {
          plate: payload.plateNumber,
        }),
        placement: 'topRight',
        duration: 8,
      })
    }

    socket.on('blacklist_attempt', handleBlacklistAttempt)

    return () => {
      socket.off('blacklist_attempt', handleBlacklistAttempt)
      releaseSocket()
    }
  }, [accessToken, notification, role, t])

  return null
}
