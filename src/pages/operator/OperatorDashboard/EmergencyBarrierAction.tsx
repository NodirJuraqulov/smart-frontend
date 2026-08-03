import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  App as AntdApp,
  Alert,
  Button,
  Input,
  Modal,
  Radio,
  Space,
  Typography,
} from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { openEmergencyBarrier } from '@/api/organizations'
import { getErrorMessage } from '@/utils/apiError'
import type { EmergencyBarrierDirection } from '@/types/organization'

interface Props {
  orgId: number
}

export default function EmergencyBarrierAction({ orgId }: Props) {
  const { t } = useTranslation()
  const { message } = AntdApp.useApp()
  const [open, setOpen] = useState(false)
  const [direction, setDirection] =
    useState<EmergencyBarrierDirection>('entry')
  const [reason, setReason] = useState('')

  const resetAndClose = () => {
    setOpen(false)
    setDirection('entry')
    setReason('')
  }

  const mutation = useMutation({
    mutationFn: () =>
      openEmergencyBarrier({
        orgId,
        direction,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      }),
    onSuccess: ({ barrier_status }) => {
      if (barrier_status === 'opened') {
        message.success(t('operatorDashboard.emergencyBarrierOpened'))
        resetAndClose()
        return
      }
      if (barrier_status === 'failed') {
        message.error(t('operatorDashboard.emergencyBarrierFailed'))
        return
      }
      message.warning(t('operatorDashboard.emergencyBarrierUnavailable'))
      resetAndClose()
    },
    onError: (error) => {
      message.error(
        getErrorMessage(
          error,
          t('operatorDashboard.emergencyBarrierRequestError'),
        ),
      )
    },
  })

  const submit = () => {
    if (mutation.isPending) return
    mutation.mutate()
  }

  const cancel = () => {
    if (mutation.isPending) return
    resetAndClose()
  }

  return (
    <>
      <Button
        danger
        type="primary"
        size="small"
        icon={<WarningOutlined />}
        onClick={() => setOpen(true)}
      >
        {t('operatorDashboard.emergencyBarrierButton')}
      </Button>
      <Modal
        open={open}
        title={t('operatorDashboard.emergencyBarrierTitle')}
        onCancel={mutation.isPending ? undefined : cancel}
        closable={!mutation.isPending}
        mask={{ closable: false }}
        width={520}
        destroyOnHidden
        footer={
          <Space>
            <Button disabled={mutation.isPending} onClick={cancel}>
              {t('common.cancel')}
            </Button>
            <Button
              danger
              type="primary"
              loading={mutation.isPending}
              disabled={mutation.isPending}
              onClick={submit}
            >
              {t('operatorDashboard.emergencyBarrierConfirm')}
            </Button>
          </Space>
        }
      >
        <Space orientation="vertical" size="large" className="w-full">
          <Alert
            showIcon
            type="warning"
            title={t('operatorDashboard.emergencyBarrierWarning')}
          />
          <Space orientation="vertical" className="w-full">
            <Typography.Text strong>
              {t('operatorDashboard.emergencyBarrierDirection')}
            </Typography.Text>
            <Radio.Group
              block
              optionType="button"
              buttonStyle="solid"
              value={direction}
              disabled={mutation.isPending}
              onChange={(event) => setDirection(event.target.value)}
              options={[
                {
                  value: 'entry',
                  label: t('operatorDashboard.directionEntryLabel'),
                },
                {
                  value: 'exit',
                  label: t('operatorDashboard.directionExitLabel'),
                },
              ]}
            />
          </Space>
          <Input.TextArea
            value={reason}
            disabled={mutation.isPending}
            maxLength={500}
            rows={3}
            placeholder={t('operatorDashboard.emergencyBarrierReason')}
            onChange={(event) => setReason(event.target.value)}
          />
        </Space>
      </Modal>
    </>
  )
}
