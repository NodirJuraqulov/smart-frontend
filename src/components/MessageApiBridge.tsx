import { useEffect } from 'react'
import { App as AntdApp } from 'antd'
import { setMessageApi } from '@/utils/notifier'

export default function MessageApiBridge() {
  const { message } = AntdApp.useApp()

  useEffect(() => {
    setMessageApi(message)
  }, [message])

  return null
}
