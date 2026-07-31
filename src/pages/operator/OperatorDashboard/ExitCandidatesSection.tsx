import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  Space,
  Table,
  Tag,
  Typography,
  type TableProps,
} from 'antd'
import { getExitCandidates } from '@/api/exitCandidates'
import AuthenticatedImage from '@/components/AuthenticatedImage'
import PlateBadge from '@/components/PlateBadge'
import { formatDate } from '@/utils/format'
import type { ExitCandidate } from '@/types/exitCandidate'
import type { ParkingSession } from '@/types/parking'
import ExitCandidateModal from './ExitCandidateModal'
import { EXIT_CANDIDATES_QUERY_KEY } from './exitCandidateQueryKeys'

interface Props {
  activeSessions: ParkingSession[]
  selectedCandidateId: number | null
  onSelectCandidate: (id: number | null) => void
}

export default function ExitCandidatesSection({
  activeSessions,
  selectedCandidateId,
  onSelectCandidate,
}: Props) {
  const { t } = useTranslation()
  const candidatesQuery = useQuery({
    queryKey: EXIT_CANDIDATES_QUERY_KEY,
    queryFn: getExitCandidates,
    refetchInterval: 15000,
  })
  const candidates = candidatesQuery.data?.candidates ?? []
  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null

  const columns: TableProps<ExitCandidate>['columns'] = [
    {
      title: t('exitCandidates.detectedPlate'),
      dataIndex: 'detected_plate',
      key: 'detected_plate',
      render: (value: string | null) =>
        value ? <PlateBadge value={value} /> : t('exitCandidates.plateNotDetected'),
    },
    {
      title: t('exitCandidates.confidence'),
      dataIndex: 'confidence',
      key: 'confidence',
      render: (value: number | null) =>
        value != null
          ? t('exitCandidates.confidenceValue', { value })
          : '—',
    },
    {
      title: t('exitCandidates.cameraTime'),
      dataIndex: 'camera_event_at',
      key: 'camera_event_at',
      render: formatDate,
    },
    {
      title: t('exitCandidates.matchedSession'),
      key: 'matched_session',
      render: (_, candidate) =>
        candidate.matched_session ? (
          <Space orientation="vertical" size={0}>
            <PlateBadge value={candidate.matched_session.plate_number} />
            <Typography.Text type="secondary">
              {t('exitCandidates.matchFound')}
            </Typography.Text>
          </Space>
        ) : (
          <Tag color="warning">{t('exitCandidates.matchNotFound')}</Tag>
        ),
    },
    {
      title: t('exitCandidates.image'),
      key: 'image',
      render: (_, candidate) => {
        const url =
          candidate.overviewImageUrl ??
          candidate.vehicleImageUrl ??
          candidate.plateImageUrl
        return url ? (
          <div className="w-28">
            <AuthenticatedImage
              url={url}
              alt={t('exitCandidates.exitImage')}
              preview={false}
              style={{ height: 72, objectFit: 'contain' }}
            />
          </div>
        ) : (
          <Typography.Text type="secondary">
            {t('sessions.noImages')}
          </Typography.Text>
        )
      },
    },
    {
      title: t('exitCandidates.status'),
      dataIndex: 'status',
      key: 'status',
      render: () => (
        <Tag color="processing">{t('exitCandidates.statusPending')}</Tag>
      ),
    },
    {
      title: t('sessions.columnActions'),
      key: 'actions',
      fixed: 'right',
      render: (_, candidate) => (
        <Button
          size="small"
          type="primary"
          onClick={() => onSelectCandidate(candidate.id)}
        >
          {t('exitCandidates.review')}
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card
        variant="borderless"
        title={
          <Space>
            <span>{t('exitCandidates.sectionTitle')}</span>
            <Badge
              count={candidatesQuery.data?.pagination.total ?? candidates.length}
              showZero
            />
          </Space>
        }
        styles={{ body: { padding: 0 } }}
        data-testid="exit-candidates-section"
      >
        {candidatesQuery.isError && (
          <div className="p-4">
            <Alert
              type="error"
              showIcon
              title={t('exitCandidates.listLoadError')}
            />
          </div>
        )}
        <Table<ExitCandidate>
          rowKey="id"
          columns={columns}
          dataSource={candidates}
          loading={candidatesQuery.isLoading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('exitCandidates.emptyState')}
              />
            ),
          }}
        />
      </Card>

      <ExitCandidateModal
        candidate={selectedCandidate}
        activeSessions={activeSessions}
        onClose={() => onSelectCandidate(null)}
      />
    </>
  )
}
