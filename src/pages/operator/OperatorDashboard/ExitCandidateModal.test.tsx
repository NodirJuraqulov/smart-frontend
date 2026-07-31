import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ExitCandidateModal from './ExitCandidateModal'
import type { ExitCandidate } from '@/types/exitCandidate'
import type { ParkingSession } from '@/types/parking'

const {
  getExitCandidateMock,
  acceptExitCandidateMock,
  reassignExitCandidateMock,
  dismissExitCandidateMock,
} = vi.hoisted(() => ({
  getExitCandidateMock: vi.fn(),
  acceptExitCandidateMock: vi.fn(),
  reassignExitCandidateMock: vi.fn(),
  dismissExitCandidateMock: vi.fn(),
}))

vi.mock('@/api/exitCandidates', () => ({
  getExitCandidate: getExitCandidateMock,
  acceptExitCandidate: acceptExitCandidateMock,
  reassignExitCandidate: reassignExitCandidateMock,
  dismissExitCandidate: dismissExitCandidateMock,
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url?: string | null; alt: string }) =>
    url ? <img data-testid="authenticated-image" src={url} alt={alt} /> : null,
}))

const matchedCandidate: ExitCandidate = {
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
  vehicleImageUrl: '/api/exit-candidates/7/images/vehicle',
  plateImageUrl: '/api/exit-candidates/7/images/plate',
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

const activeSession: ParkingSession = {
  id: 44,
  org_id: 2,
  plate_number: '01A777BA',
  entered_at: '2026-08-01T07:00:00.000Z',
  exited_at: null,
  duration_minutes: null,
  amount: null,
  status: 'active',
  entry_method: 'auto',
  exit_method: null,
  session_source: 'regular',
  entryOverviewImageUrl: '/api/parking/sessions/44/images/entry-overview',
  operator_id: null,
  created_at: '2026-08-01T07:00:00.000Z',
}

const otherSession: ParkingSession = {
  ...activeSession,
  id: 55,
  plate_number: '01B555BB',
  session_source: 'vip',
  entryOverviewImageUrl: '/api/parking/sessions/55/images/entry-overview',
}

function renderModal(
  candidate: ExitCandidate = matchedCandidate,
  activeSessions: ParkingSession[] = [activeSession, otherSession],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitCandidateModal
          candidate={candidate}
          activeSessions={activeSessions}
          onClose={onClose}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { queryClient, onClose }
}

describe('ExitCandidateModal', () => {
  beforeEach(() => {
    getExitCandidateMock.mockReset().mockResolvedValue({
      candidate: matchedCandidate,
      suggestions: [matchedCandidate.matched_session].filter(Boolean),
    })
    acceptExitCandidateMock.mockReset().mockResolvedValue({
      ...matchedCandidate,
      status: 'accepted',
    })
    reassignExitCandidateMock.mockReset().mockResolvedValue({
      ...matchedCandidate,
      status: 'accepted',
      resolution_type: 'reassigned',
    })
    dismissExitCandidateMock.mockReset().mockResolvedValue({
      ...matchedCandidate,
      status: 'dismissed',
    })
  })

  it('matched candidate tafsilotlari va rasmlarini authenticated komponentda ko‘rsatadi', async () => {
    renderModal()

    expect(await screen.findAllByText('01A777BA')).toHaveLength(2)
    const images = screen.getAllByTestId('authenticated-image')
    expect(images.map((image) => image.getAttribute('src'))).toEqual(
      expect.arrayContaining([
        '/api/exit-candidates/7/images/overview',
        '/api/exit-candidates/7/images/vehicle',
        '/api/exit-candidates/7/images/plate',
        '/api/parking/sessions/44/images/entry-overview',
      ]),
    )
  })

  it('exact matched active candidate ni accept qiladi va tegishli querylarni yangilaydi', async () => {
    const { queryClient, onClose } = renderModal()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    fireEvent.click(await screen.findByRole('button', { name: 'Tasdiqlash' }))

    await waitFor(() => expect(acceptExitCandidateMock).toHaveBeenCalledWith(7))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['parking', 'awaiting-payment'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['parking', 'active'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['reports', 'daily'],
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('VIP/subscription natijasini frontendda hisoblamay active va stats querylarini yangilaydi', async () => {
    const vipCandidate: ExitCandidate = {
      ...matchedCandidate,
      matched_session: {
        ...matchedCandidate.matched_session!,
        session_source: 'vip',
      },
    }
    getExitCandidateMock.mockResolvedValue({
      candidate: vipCandidate,
      suggestions: [vipCandidate.matched_session],
    })
    const { queryClient } = renderModal(vipCandidate)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    fireEvent.click(await screen.findByRole('button', { name: 'Tasdiqlash' }))

    await waitFor(() => expect(acceptExitCandidateMock).toHaveBeenCalledWith(7))
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['parking', 'active'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['parking', 'capacity'],
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['reports', 'daily'],
    })
  })

  it('matched sessiyasi yo‘q candidate uchun accept tugmasini bloklaydi', async () => {
    const unmatched = {
      ...matchedCandidate,
      matched_session_id: null,
      matched_session: null,
    }
    getExitCandidateMock.mockResolvedValue({
      candidate: unmatched,
      suggestions: [],
    })
    renderModal(unmatched, [])

    expect(
      await screen.findByText(/mos faol sessiya topilmadi/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tasdiqlash' })).toBeDisabled()
  })

  it('boshqa active sessiyani tanlab reassign qiladi', async () => {
    renderModal()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Boshqa sessiyani tanlash' }),
    )

    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText(/01B555BB/))
    fireEvent.click(
      screen.getByRole('button', { name: 'Biriktirish va tasdiqlash' }),
    )

    await waitFor(() =>
      expect(reassignExitCandidateMock).toHaveBeenCalledWith(7, 55),
    )
  })

  it('dismiss oldidan confirmation va sessiya o‘zgarmasligi ogohlantirishini ko‘rsatadi', async () => {
    renderModal()
    fireEvent.click(await screen.findByRole('button', { name: 'Rad etish' }))

    expect(
      screen.getByText('Rad etilganda to‘xtash joyi sessiyasi o‘zgarmaydi.'),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Izoh yoki sabab (ixtiyoriy)'), {
      target: { value: 'OCR xato' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Rad etishni tasdiqlash' }),
    )

    await waitFor(() =>
      expect(dismissExitCandidateMock).toHaveBeenCalledWith(7, 'OCR xato'),
    )
  })

  it('409 bo‘lsa ro‘yxatni yangilaydi, xabar beradi va modalni yopadi', async () => {
    acceptExitCandidateMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409 },
    })
    const { queryClient, onClose } = renderModal()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    fireEvent.click(await screen.findByRole('button', { name: 'Tasdiqlash' }))

    expect(
      await screen.findByText(/boshqa operator tomonidan hal qilingan/i),
    ).toBeInTheDocument()
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['exit-candidates'],
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('detail refetch candidate allaqachon hal qilinganini ko‘rsatsa modalni yopadi', async () => {
    getExitCandidateMock.mockResolvedValue({
      candidate: { ...matchedCandidate, status: 'accepted' },
      suggestions: [],
    })
    const { onClose } = renderModal()

    expect(
      await screen.findByText(/boshqa operator tomonidan hal qilingan/i),
    ).toBeInTheDocument()
    expect(onClose).toHaveBeenCalled()
  })

  it('mutation tugamaguncha double submitni bloklaydi', async () => {
    let resolveRequest!: (value: ExitCandidate) => void
    acceptExitCandidateMock.mockReturnValue(
      new Promise<ExitCandidate>((resolve) => {
        resolveRequest = resolve
      }),
    )
    renderModal()
    const acceptButton = await screen.findByRole('button', {
      name: 'Tasdiqlash',
    })

    fireEvent.click(acceptButton)
    fireEvent.click(acceptButton)
    await waitFor(() =>
      expect(acceptExitCandidateMock).toHaveBeenCalledTimes(1),
    )
    expect(acceptButton).toBeDisabled()

    resolveRequest({ ...matchedCandidate, status: 'accepted' })
    await waitFor(() => expect(acceptExitCandidateMock).toHaveBeenCalledTimes(1))
  })
})
