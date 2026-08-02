import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import EntryCandidateModal from './EntryCandidateModal'
import type {
  EntryCandidateNext,
  EntryCandidateReason,
} from '@/types/entryCandidate'

const {
  acceptEntryCandidateMock,
  declineEntryCandidateMock,
  retryEntryBarrierMock,
} = vi.hoisted(() => ({
  acceptEntryCandidateMock: vi.fn(),
  declineEntryCandidateMock: vi.fn(),
  retryEntryBarrierMock: vi.fn(),
}))

vi.mock('@/api/entryCandidates', () => ({
  acceptEntryCandidate: acceptEntryCandidateMock,
  declineEntryCandidate: declineEntryCandidateMock,
  retryEntryBarrier: retryEntryBarrierMock,
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url: string; alt: string }) => (
    <img src={url} alt={alt} />
  ),
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

function renderModal(value: EntryCandidateNext = candidate) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onClose = vi.fn()
  const onResolved = vi.fn()
  const onPendingRefresh = vi.fn()
  const onDataChanged = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EntryCandidateModal
          candidate={value}
          onClose={onClose}
          onResolved={onResolved}
          onPendingRefresh={onPendingRefresh}
          onDataChanged={onDataChanged}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { onClose, onResolved, onPendingRefresh, onDataChanged }
}

describe('EntryCandidateModal', () => {
  beforeEach(() => {
    acceptEntryCandidateMock.mockReset().mockResolvedValue({
      session_id: 1,
      plate: '01A777BA',
      barrier_status: 'opened',
    })
    declineEntryCandidateMock.mockReset().mockResolvedValue({
      status: 'declined',
    })
    retryEntryBarrierMock.mockReset().mockResolvedValue({
      barrier_status: 'opened',
    })
  })

  it.each<[
    EntryCandidateReason,
    string,
  ]>([
    ['capacity_full', 'Diqqat: Parking to‘lgan'],
    ['plate_not_detected', 'Diqqat: Raqam aniqlanmadi'],
    [
      'capacity_full_and_plate_not_detected',
      'Diqqat: Parking to‘lgan va raqam aniqlanmadi',
    ],
  ])('%s reason uchun to‘g‘ri sarlavha ko‘rsatadi', (reason, title) => {
    renderModal({ ...candidate, reason })

    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('plate bo‘sh bo‘lsa Kiritish tugmasini bloklaydi', () => {
    renderModal({ ...candidate, detected_plate: null })

    expect(screen.getByPlaceholderText('Davlat raqamini kiriting')).toHaveValue(
      '',
    )
    expect(screen.getByText('Davlat raqami kiritilishi kerak')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kiritish' })).toBeDisabled()
  })

  it('image_available false bo‘lsa rasm so‘ramaydi va bo‘sh holatni ko‘rsatadi', () => {
    renderModal({
      ...candidate,
      entry_images: {
        overview_url: '/api/entry-overview',
        vehicle_url: '/api/entry-vehicle',
        image_available: false,
      },
    })

    expect(screen.getByText('Rasm mavjud emas')).toBeInTheDocument()
    expect(
      screen.queryByAltText('Kirish — avtomobil'),
    ).not.toBeInTheDocument()
  })

  it('accept opened bo‘lsa payload yuboradi, refetch callback va close chaqiradi', async () => {
    const { onResolved, onDataChanged } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Kiritish' }))

    await waitFor(() =>
      expect(acceptEntryCandidateMock).toHaveBeenCalledWith(1, {
        plate_number: '01A777BA',
      }),
    )
    expect(onDataChanged).toHaveBeenCalled()
    expect(onResolved).toHaveBeenCalled()
  })

  it('accept 409 active plate bo‘lsa xabar ko‘rsatadi va input fokusda qoladi', async () => {
    acceptEntryCandidateMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          message: 'Bu mashina hali stoyankada!',
          existing_session: { id: 25 },
        },
      },
    })
    renderModal()
    const input = screen.getByPlaceholderText('Davlat raqamini kiriting')
    fireEvent.click(screen.getByRole('button', { name: 'Kiritish' }))

    expect(
      await screen.findByText(
        'Bu raqam allaqachon stoyanka ichida. Boshqa davlat raqamini kiriting',
      ),
    ).toBeInTheDocument()
    await waitFor(() => expect(input).toHaveFocus())
  })

  it('accept 409 resolved bo‘lsa modal oqimini keyingi candidatega o‘tkazadi', async () => {
    acceptEntryCandidateMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: 'Bu kirish allaqachon hal qilingan' },
      },
    })
    const { onResolved } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Kiritish' }))

    expect(
      await screen.findByText(
        'Bu kirish allaqachon boshqa operator tomonidan hal qilingan',
      ),
    ).toBeInTheDocument()
    expect(onResolved).toHaveBeenCalled()
  })

  it('accept barrier failed bo‘lsa retry-entry-barrierni session_id bilan chaqiradi', async () => {
    acceptEntryCandidateMock.mockResolvedValue({
      session_id: 9,
      plate: '01A777BA',
      barrier_status: 'failed',
    })
    const { onResolved } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Kiritish' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Qayta ochish' }))

    await waitFor(() =>
      expect(retryEntryBarrierMock).toHaveBeenCalledWith(9),
    )
    expect(onResolved).toHaveBeenCalled()
  })

  it('barrier disabled bo‘lsa retry tugmasini ko‘rsatmaydi', async () => {
    acceptEntryCandidateMock.mockResolvedValue({
      session_id: 9,
      plate: '01A777BA',
      barrier_status: 'disabled',
    })
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Kiritish' }))

    expect(
      await screen.findByText(
        'Mashina kiritildi, lekin shlagbaum konfiguratsiya qilinmagan. Administrator bilan bog‘laning',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Qayta ochish' }),
    ).not.toBeInTheDocument()
  })

  it('decline tasdiqlanganda endpointni chaqiradi va modalni yopadi', async () => {
    const { onResolved } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Rad etish' }))

    expect(
      screen.getByText('Bu mashinani rad etishni tasdiqlaysizmi?'),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Rad etishni tasdiqlash' }),
    )

    await waitFor(() =>
      expect(declineEntryCandidateMock).toHaveBeenCalledWith(1),
    )
    expect(onResolved).toHaveBeenCalled()
  })
})
