import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, Empty, Table } from 'antd'
import { getActiveSessions } from '@/api/parking'
import { useTheme } from '@/contexts/ThemeContext'
import { useAppSelector } from '@/hooks/redux'
import ReceiptModal from '@/components/ReceiptModal'
import type { ParkingSession, Payment } from '@/types/parking'
import { useSharedImagePreview } from './useSharedImagePreview'
import { buildColumns } from './columns'
import ForceCloseModal from './ForceCloseModal'

interface ReceiptState {
  session: ParkingSession
  payment: Payment
}

export default function ActiveSessionsTab() {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { setPreviewSrc, previewElement } = useSharedImagePreview()
  const orgName = useAppSelector((state) => state.auth.user?.org_name)
  const [forceCloseTarget, setForceCloseTarget] = useState<ParkingSession | null>(
    null,
  )
  const [receipt, setReceipt] = useState<ReceiptState | null>(null)

  const activeQuery = useQuery({
    queryKey: ['parking', 'active'],
    queryFn: getActiveSessions,
    refetchInterval: 10000,
  })

  const columns = buildColumns(t, mode, setPreviewSrc, {
    onForceClose: setForceCloseTarget,
  })

  return (
    <>
      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        {previewElement}
        <Table<ParkingSession>
          rowKey="id"
          columns={columns}
          dataSource={activeQuery.data ?? []}
          loading={activeQuery.isLoading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('sessions.activeEmptyState')}
              />
            ),
          }}
        />
      </Card>

      <ForceCloseModal
        session={forceCloseTarget}
        onClose={() => setForceCloseTarget(null)}
        onForceClosed={setReceipt}
      />

      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        session={receipt?.session ?? null}
        amount={receipt?.payment?.amount ?? null}
        paymentMethod={receipt?.payment?.payment_method ?? null}
        orgName={orgName}
      />
    </>
  )
}
