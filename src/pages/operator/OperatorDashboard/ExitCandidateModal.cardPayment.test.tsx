import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExitCandidateModal from './ExitCandidateModal'
import { CardPaymentProvider } from '@/contexts/CardPaymentContext'
import type { ExitCandidateNext } from '@/types/exitCandidate'

interface SocketCallbacks {
  onCardPaymentStarted?: (payload: {
    orgId?: number
    sessionId: number
    candidateId: number | null
    operationNumber: string
    plateNumber: string
  }) => void
  onExitPaymentDeclined?: (payload: {
    orgId: number
    sessionId: number | null
    operationNumber: string
    reason: 'declined' | 'timeout'
    errorMessage: string | null
  }) => void
}

const {
  getCardTerminalSettingsMock,
  retryCardPaymentMock,
  socketCallbacksRef,
} = vi.hoisted(() => ({
  getCardTerminalSettingsMock: vi.fn(),
  retryCardPaymentMock: vi.fn(),
  socketCallbacksRef: { current: null as SocketCallbacks | null },
}))

vi.mock('@/api/organizations', () => ({
  getCardTerminalSettings: getCardTerminalSettingsMock,
}))

vi.mock('@/api/parking', () => ({
  retryCardPayment: retryCardPaymentMock,
}))

vi.mock('@/api/exitCandidates', () => ({
  confirmExitCandidate: vi.fn(),
  forceOpenExitCandidate: vi.fn(),
  previewExitSession: vi.fn().mockResolvedValue({}),
  retryExitCandidateBarrier: vi.fn(),
  searchExitCandidate: vi.fn(),
}))

vi.mock('@/hooks/useParkingSocket', () => ({
  useParkingSocket: (callbacks: SocketCallbacks) => {
    socketCallbacksRef.current = callbacks
  },
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { role: 'operator', org_id: 3 } } }),
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url?: string | null; alt: string }) =>
    url ? <img src={url} alt={alt} /> : null,
}))

const candidate: ExitCandidateNext = {
  candidate_id: '7',
  status: 'pending',
  webhook_event_id: '91',
  detected_plate: '01A777BA',
  camera_event_at: '2026-09-05T08:00:00.000Z',
  exit_images: {
    overview_url: '/exit-overview',
    vehicle_url: '/exit-vehicle',
    image_available: true,
  },
  matched_session: {
    session_id: '44',
    plate_number: '01A777BA',
    session_source: 'regular',
    entered_at: '2026-09-05T07:00:00.000Z',
    entry_images: {
      overview_url: '/entry-overview',
      vehicle_url: '/entry-vehicle',
      image_available: true,
    },
    duration_minutes: 60,
    tariff_snapshot_amount: 12000,
  },
  pending_count_for_org: 1,
}

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <CardPaymentProvider>
          <ExitCandidateModal
            candidate={candidate}
            onClose={vi.fn()}
            onResolved={vi.fn()}
            onPendingRefresh={vi.fn()}
            onDataChanged={vi.fn()}
          />
        </CardPaymentProvider>
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ExitCandidateModal card payment decline', () => {
  beforeEach(() => {
    getCardTerminalSettingsMock.mockReset().mockResolvedValue({
      card_terminal_enabled: true,
      card_terminal_ip: '192.168.1.55',
      card_terminal_port: 62801,
      card_terminal_id: null,
      card_terminal_merchant_id: null,
    })
    retryCardPaymentMock.mockReset().mockResolvedValue({
      session_id: 44,
      status: 'awaiting_payment',
      operation_number: 'op-2',
    })
    socketCallbacksRef.current = null
  })

  it('faqat mos candidate uchun Alert va retry ko‘rsatadi, card radiosini qo‘shmaydi', async () => {
    renderModal()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current?.onCardPaymentStarted?.({
        orgId: 3,
        sessionId: 44,
        candidateId: 7,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      })
      socketCallbacksRef.current?.onExitPaymentDeclined?.({
        orgId: 3,
        sessionId: 44,
        operationNumber: 'op-1',
        reason: 'declined',
        errorMessage: null,
      })
    })

    expect(
      screen.getAllByText("Karta orqali to'lov amalga oshmadi").length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(
        "Karta to'lovini qayta boshlang yoki Naqd/Online usuliga o'ting",
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.queryByRole('radio', { name: 'Karta' })).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'Karta orqali qayta urinish' }),
    )

    await waitFor(() => expect(retryCardPaymentMock).toHaveBeenCalledWith(44))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Karta orqali qayta urinish' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('boshqa candidate decline eventini modal ichida ko‘rsatmaydi', async () => {
    renderModal()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current?.onCardPaymentStarted?.({
        orgId: 3,
        sessionId: 44,
        candidateId: 8,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      })
      socketCallbacksRef.current?.onExitPaymentDeclined?.({
        orgId: 3,
        sessionId: 44,
        operationNumber: 'op-1',
        reason: 'timeout',
        errorMessage: null,
      })
    })

    expect(
      screen.queryByRole('button', { name: 'Karta orqali qayta urinish' }),
    ).not.toBeInTheDocument()
  })
})
