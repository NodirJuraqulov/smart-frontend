import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import EntryCandidateModal from './EntryCandidateModal'
import type { EntryCandidateNext } from '@/types/entryCandidate'

const { axiosGetMock } = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: axiosGetMock,
  },
}))

vi.mock('@/api/entryCandidates', () => ({
  acceptEntryCandidate: vi.fn(),
  declineEntryCandidate: vi.fn(),
  retryEntryBarrier: vi.fn(),
}))

const candidate: EntryCandidateNext = {
  candidate_id: 1,
  detected_plate: '01A777BA',
  camera_event_at: '2026-08-02T08:00:00.000Z',
  confidence: 97.5,
  reason: 'capacity_full',
  entry_images: {
    overview_url: '/api/entry-overview',
    vehicle_url: '/api/entry-vehicle',
    image_available: true,
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
        <EntryCandidateModal
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

describe('EntryCandidateModal rasm yuklanishi', () => {
  it("rasm hali yuklanmagan bolsada candidate malumotlari darhol korinadi", () => {
    axiosGetMock.mockReturnValue(new Promise(() => undefined))

    renderModal()

    expect(screen.getByDisplayValue('01A777BA')).toBeInTheDocument()
    expect(screen.getByText(/97[.,]5%/)).toBeInTheDocument()
  })

  it("rasm yuklanayotganda skeleton korsatiladi", () => {
    axiosGetMock.mockReturnValue(new Promise(() => undefined))

    renderModal()

    expect(document.querySelectorAll('.ant-skeleton-image').length).toBe(1)
  })

  it("rasm yuklangach haqiqiy rasmga almashadi", async () => {
    axiosGetMock.mockResolvedValue({ data: new Blob(['image']) })
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:entry-image'),
      revokeObjectURL: vi.fn(),
    })

    renderModal()

    await waitFor(() =>
      expect(screen.getByRole('img', { name: 'Kirish — avtomobil' })).toBeInTheDocument(),
    )
    expect(document.querySelectorAll('.ant-skeleton-image').length).toBe(0)
  })

  it("rasm xato bilan yuklanmasa Rasm mavjud emas holatiga mos xabar korsatiladi (regression)", async () => {
    axiosGetMock.mockRejectedValue(new Error('network error'))

    renderModal()

    expect(
      await screen.findByText("Kirish — avtomobil rasmini yuklab bo'lmadi"),
    ).toBeInTheDocument()
  })
})
