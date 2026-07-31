import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ExitCandidatesSection from './ExitCandidatesSection'
import type { ExitCandidate } from '@/types/exitCandidate'

const { getExitCandidatesMock } = vi.hoisted(() => ({
  getExitCandidatesMock: vi.fn(),
}))

vi.mock('@/api/exitCandidates', () => ({
  getExitCandidates: getExitCandidatesMock,
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url?: string | null; alt: string }) =>
    url ? <img data-testid="authenticated-image" src={url} alt={alt} /> : null,
}))

vi.mock('./ExitCandidateModal', () => ({
  default: () => null,
}))

const candidate: ExitCandidate = {
  id: 7,
  org_id: 2,
  webhook_event_id: 101,
  detected_plate: '01A777BA',
  matched_session_id: 44,
  resolved_session_id: null,
  confidence: 96.5,
  camera_event_at: '2026-08-01T08:00:00.000Z',
  status: 'pending',
  resolution_type: null,
  resolved_by: null,
  resolved_at: null,
  resolution_note: null,
  created_at: '2026-08-01T08:00:01.000Z',
  updated_at: '2026-08-01T08:00:01.000Z',
  overviewImageUrl: '/api/exit-candidates/7/images/overview',
  vehicleImageUrl: null,
  plateImageUrl: null,
  matched_session: {
    id: 44,
    org_id: 2,
    plate_number: '01A777BA',
    entered_at: '2026-08-01T07:00:00.000Z',
    exited_at: null,
    status: 'active',
    session_source: 'regular',
    amount: null,
    duration_minutes: null,
  },
}

describe('ExitCandidatesSection', () => {
  beforeEach(() => {
    getExitCandidatesMock.mockReset().mockResolvedValue({
      candidates: [candidate],
      pagination: { page: 1, limit: 100, total: 1, total_pages: 1 },
    })
  })

  it('pending candidate ro‘yxatini va protected rasmni ko‘rsatadi', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <ExitCandidatesSection
            activeSessions={[]}
            selectedCandidateId={null}
            onSelectCandidate={vi.fn()}
          />
        </AntdApp>
      </QueryClientProvider>,
    )

    expect(await screen.findAllByText('01A777BA')).toHaveLength(2)
    expect(screen.getByText('Chiqish tekshiruvi')).toBeInTheDocument()
    expect(screen.getByText('Tekshiruv kutilmoqda')).toBeInTheDocument()
    expect(screen.getByText('Mos sessiya topildi')).toBeInTheDocument()
    expect(screen.getByTestId('authenticated-image')).toHaveAttribute(
      'src',
      '/api/exit-candidates/7/images/overview',
    )
  })
})
