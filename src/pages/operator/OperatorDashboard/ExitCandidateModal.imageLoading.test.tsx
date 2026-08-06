import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ExitCandidateModal from './ExitCandidateModal'
import type { ExitCandidateNext } from '@/types/exitCandidate'

const { axiosGetMock } = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: axiosGetMock,
  },
}))

vi.mock('@/api/exitCandidates', () => ({
  confirmExitCandidate: vi.fn(),
  forceOpenExitCandidate: vi.fn(),
  retryExitCandidateBarrier: vi.fn(),
  searchExitCandidate: vi.fn(),
}))

const candidate: ExitCandidateNext = {
  candidate_id: 'candidate-1',
  status: 'pending',
  webhook_event_id: 'event-1',
  detected_plate: '01A777BA',
  camera_event_at: '2026-08-01T08:00:00.000Z',
  exit_images: {
    overview_url: '/api/events/event-1/exit-overview',
    vehicle_url: '/api/events/event-1/exit-vehicle',
    image_available: true,
  },
  matched_session: {
    session_id: 'session-1',
    plate_number: '01A777BA',
    session_source: 'regular',
    entered_at: '2026-08-01T07:00:00.000Z',
    entry_images: {
      overview_url: '/api/sessions/session-1/entry-overview',
      vehicle_url: '/api/sessions/session-1/entry-vehicle',
      image_available: true,
    },
    duration_minutes: 60,
    tariff_snapshot_amount: 12000,
  },
  pending_count_for_org: 1,
}

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitCandidateModal
          candidate={candidate}
          onClose={vi.fn()}
          onResolved={vi.fn()}
          onPendingRefresh={vi.fn()}
          onDataChanged={vi.fn()}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ExitCandidateModal rasm yuklanishi', () => {
  it("rasm hali yuklanmagan bolsada candidate malumotlari darhol korinadi", () => {
    axiosGetMock.mockReturnValue(new Promise(() => undefined))

    renderModal()

    expect(screen.getByText('01A777BA')).toBeInTheDocument()
    expect(screen.getByText('12 000 so\'m')).toBeInTheDocument()
  })

  it("rasm yuklanayotganda skeleton korsatiladi", () => {
    axiosGetMock.mockReturnValue(new Promise(() => undefined))

    renderModal()

    expect(document.querySelectorAll('.ant-skeleton-image').length).toBe(2)
  })

  it("rasm yuklangach haqiqiy rasmga almashadi", async () => {
    axiosGetMock.mockResolvedValue({ data: new Blob(['image']) })
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:exit-image'),
      revokeObjectURL: vi.fn(),
    })

    renderModal()

    await waitFor(() =>
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0),
    )
    expect(document.querySelectorAll('.ant-skeleton-image').length).toBe(0)
  })

  it("rasm xato bilan yuklanmasa Rasm mavjud emas holatiga mos xabar korsatiladi (regression)", async () => {
    axiosGetMock.mockRejectedValue(new Error('network error'))

    renderModal()

    expect(
      await screen.findByText(
        "Chiqish — avtomobil rasmini yuklab bo'lmadi",
      ),
    ).toBeInTheDocument()
  })
})
