import { Button, Space, Tag, type TableProps } from 'antd'
import {
  EyeOutlined,
  FileTextOutlined,
  FormOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { getSessionStatusTagStyle, getWarningTagStyle } from '@/theme/statusColors'
import { formatDate, formatDuration, formatMoney } from '@/utils/format'
import { buildMediaUrl } from '@/utils/media'
import PlateBadge from '@/components/PlateBadge'
import type { ParkingSession } from '@/types/parking'

function MethodTag({ method }: { method: ParkingSession['entry_method'] }) {
  const { t } = useTranslation()
  return method === 'auto' ? (
    <Tag icon={<ThunderboltOutlined />}>{t('sessions.methodAuto')}</Tag>
  ) : (
    <Tag icon={<FormOutlined />}>{t('sessions.methodManual')}</Tag>
  )
}

function ImagePreviewButton({
  path,
  label,
  onPreview,
}: {
  path: string
  label: string
  onPreview: (url: string) => void
}) {
  return (
    <Button
      size="small"
      icon={<EyeOutlined />}
      onClick={() => onPreview(buildMediaUrl(path))}
    >
      {label}
    </Button>
  )
}

export function buildColumns(
  t: (key: string, opts?: Record<string, unknown>) => string,
  mode: 'light' | 'dark',
  onPreview: (url: string) => void,
  actions?: {
    onReceipt?: (record: ParkingSession) => void
    onForceClose?: (record: ParkingSession) => void
  },
): TableProps<ParkingSession>['columns'] {
  const columns: TableProps<ParkingSession>['columns'] = [
    {
      title: t('sessions.columnPlate'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      render: (value: string) => <PlateBadge value={value} />,
    },
    {
      title: t('sessions.columnEntered'),
      dataIndex: 'entered_at',
      key: 'entered_at',
      render: (value: string) => formatDate(value),
    },
    {
      title: t('sessions.columnExited'),
      dataIndex: 'exited_at',
      key: 'exited_at',
      render: (value: string | null) => (value ? formatDate(value) : '—'),
    },
    {
      title: t('sessions.columnDuration'),
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (value: number | null) =>
        value != null ? formatDuration(value) : '—',
    },
    {
      title: t('sessions.columnAmount'),
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number | null) => (value != null ? formatMoney(value) : '—'),
    },
    {
      title: t('sessions.columnStatus'),
      key: 'status',
      render: (_, record) => (
        <Tag style={getSessionStatusTagStyle(record.status, mode)}>
          {record.status === 'active'
            ? t('sessions.statusActive')
            : t('sessions.statusCompleted')}
        </Tag>
      ),
    },
    {
      title: t('sessions.columnMethod'),
      key: 'method',
      render: (_, record) => (
        <Space wrap size={4}>
          <MethodTag method={record.entry_method} />
          {record.exit_method === 'forced' && (
            <Tag style={getWarningTagStyle(mode)} icon={<WarningOutlined />}>
              {t('sessions.forcedExitTag')}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('sessions.columnImages'),
      key: 'images',
      render: (_, record) => (
        <Space>
          {record.image_entry && (
            <ImagePreviewButton
              path={record.image_entry}
              label={t('sessions.viewEntryImage')}
              onPreview={onPreview}
            />
          )}
          {record.image_exit && (
            <ImagePreviewButton
              path={record.image_exit}
              label={t('sessions.viewExitImage')}
              onPreview={onPreview}
            />
          )}
        </Space>
      ),
    },
  ]

  if (actions?.onReceipt || actions?.onForceClose) {
    columns.push({
      title: t('sessions.columnActions'),
      key: 'actions',
      render: (_, record) => {
        if (record.status === 'completed' && actions.onReceipt) {
          return (
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => actions.onReceipt!(record)}
            >
              {t('sessions.receiptButton')}
            </Button>
          )
        }
        if (record.status === 'active' && actions.onForceClose) {
          return (
            <Button
              size="small"
              danger
              icon={<WarningOutlined />}
              onClick={() => actions.onForceClose!(record)}
            >
              {t('sessions.forceCloseButton')}
            </Button>
          )
        }
        return null
      },
    })
  }

  return columns
}
