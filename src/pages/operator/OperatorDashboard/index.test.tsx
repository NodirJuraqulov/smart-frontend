import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import OperatorDashboard from './index'
import type { DetectionType } from '@/types/parking'
import type {
  ExitCandidate,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'

interface SocketCallbacks {
  onEntry?: (...args: unknown[]) => void
  onExit?: (...args: unknown[]) => void
  onDetectionFailed?: (type: DetectionType, imageUrl: string) => void
  onAwaitingPayment?: (...args: unknown[]) => void
  onExitCompleted?: (...args: unknown[]) => void
  onExitCandidateCreated?: (candidate: ExitCandidate) => void
  onExitCandidateResolved?: (payload: ExitCandidateResolvedEvent) => void
  onRelayFailed?: (direction: 'entry' | 'exit', message: string) => void
  onWebhookParseFailed?: (direction: 'entry' | 'exit', message: string) => void
}

const {
  entryManualMock,
  exitManualMock,
  getActiveSessionsMock,
  getCapacityMock,
  updateSessionPaymentMethodMock,
  getAwaitingPaymentsMock,
  confirmCashPaymentMock,
  openBarrierForSessionMock,
  getDailyReportMock,
  getSettingsMock,
  useAppSelectorMock,
  socketCallbacksRef,
} = vi.hoisted(() => ({
  entryManualMock: vi.fn(),
  exitManualMock: vi.fn(),
  getActiveSessionsMock: vi.fn(),
  getCapacityMock: vi.fn(),
  updateSessionPaymentMethodMock: vi.fn(),
  getAwaitingPaymentsMock: vi.fn(),
  confirmCashPaymentMock: vi.fn(),
  openBarrierForSessionMock: vi.fn(),
  getDailyReportMock: vi.fn(),
  getSettingsMock: vi.fn(),
  useAppSelectorMock: vi.fn(),
  socketCallbacksRef: { current: null as SocketCallbacks | null },
}))

vi.mock('@/api/parking', () => ({
  entryManual: entryManualMock,
  exitManual: exitManualMock,
  getActiveSessions: getActiveSessionsMock,
  getCapacity: getCapacityMock,
  updateSessionPaymentMethod: updateSessionPaymentMethodMock,
  getAwaitingPayments: getAwaitingPaymentsMock,
  confirmCashPayment: confirmCashPaymentMock,
  openBarrierForSession: openBarrierForSessionMock,
}))

vi.mock('@/api/reports', () => ({
  getDailyReport: getDailyReportMock,
}))

vi.mock('@/api/settings', () => ({
  getSettings: getSettingsMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

vi.mock('@/hooks/useParkingSocket', () => ({
  useParkingSocket: (callbacks: SocketCallbacks) => {
    socketCallbacksRef.current = callbacks
  },
}))

vi.mock('./ExitCandidatesSection', () => ({
  default: ({
    selectedCandidateId,
  }: {
    selectedCandidateId: number | null
  }) => (
    <div
      data-testid="exit-candidates-section"
      data-selected-candidate={selectedCandidateId ?? ''}
    />
  ),
}))

function renderDashboard() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <OperatorDashboard />
      </AntdApp>
    </QueryClientProvider>,
  )
  return queryClient
}

const pendingCandidate: ExitCandidate = {
  id: 7,
  org_id: 2,
  webhook_event_id: 101,
  detected_plate: '01A777BA',
  matched_session_id: null,
  resolved_session_id: null,
  confidence: 94,
  camera_event_at: '2026-08-01T08:00:00.000Z',
  status: 'pending',
  resolution_type: null,
  resolved_by: null,
  resolved_at: null,
  resolution_note: null,
  created_at: '2026-08-01T08:00:01.000Z',
  updated_at: '2026-08-01T08:00:01.000Z',
  overviewImageUrl: null,
  vehicleImageUrl: null,
  plateImageUrl: null,
  matched_session: null,
}

function triggerDetectionFailed(imageUrl: string) {
  socketCallbacksRef.current?.onDetectionFailed?.('entry', imageUrl)
}

async function openManualEntryModal() {
  fireEvent.click(
    await screen.findByRole('button', { name: "Qo'lda kiritish" }),
  )
}

describe('OperatorDashboard manual entry modal', () => {
  beforeEach(() => {
    entryManualMock.mockReset()
    exitManualMock.mockReset()
    getActiveSessionsMock.mockReset().mockResolvedValue([])
    getCapacityMock.mockReset().mockResolvedValue({
      occupied: 0,
      total: null,
      available: null,
    })
    updateSessionPaymentMethodMock.mockReset()
    getAwaitingPaymentsMock.mockReset().mockResolvedValue([])
    confirmCashPaymentMock.mockReset()
    openBarrierForSessionMock.mockReset()
    getDailyReportMock.mockReset().mockResolvedValue({})
    getSettingsMock.mockReset().mockResolvedValue({})
    useAppSelectorMock.mockReset().mockReturnValue(undefined)
    socketCallbacksRef.current = null
  })

  it("'Bekor qilish' bosilgandan keyin qayta ochilganda input bo'sh bo'ladi (regression)", async () => {
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    triggerDetectionFailed('http://example.com/a.jpg')
    await openManualEntryModal()
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01A777BA'), {
      target: { value: '01A777BA' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    triggerDetectionFailed('http://example.com/b.jpg')
    await openManualEntryModal()

    expect(screen.queryByDisplayValue('01A777BA')).not.toBeInTheDocument()
  })

  it("muvaffaqiyatli yuborilgandan keyin qayta ochilganda input bo'sh bo'ladi", async () => {
    entryManualMock.mockResolvedValue({ id: 1 })
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    triggerDetectionFailed('http://example.com/a.jpg')
    await openManualEntryModal()
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01A777BA'), {
      target: { value: '01A777BA' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(entryManualMock).toHaveBeenCalled())

    triggerDetectionFailed('http://example.com/b.jpg')
    await openManualEntryModal()

    expect(screen.queryByDisplayValue('01A777BA')).not.toBeInTheDocument()
  })
})

describe('OperatorDashboard qurilma ogohlantirishlari', () => {
  beforeEach(() => {
    entryManualMock.mockReset()
    exitManualMock.mockReset()
    getActiveSessionsMock.mockReset().mockResolvedValue([])
    getCapacityMock.mockReset().mockResolvedValue({
      occupied: 0,
      total: null,
      available: null,
    })
    updateSessionPaymentMethodMock.mockReset()
    getAwaitingPaymentsMock.mockReset().mockResolvedValue([])
    confirmCashPaymentMock.mockReset()
    openBarrierForSessionMock.mockReset()
    getDailyReportMock.mockReset().mockResolvedValue({})
    getSettingsMock.mockReset().mockResolvedValue({})
    useAppSelectorMock.mockReset().mockReturnValue(undefined)
    socketCallbacksRef.current = null
  })

  it("relay_failed kelganda togri yonalish bilan ogohlantirish korsatadi (regression)", async () => {
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    socketCallbacksRef.current!.onRelayFailed?.(
      'exit',
      "Shlagbaum avtomatik ochilmadi, qo'lda oching",
    )

    expect(await screen.findByText('Shlagbaum ochilmadi')).toBeInTheDocument()
    expect(
      screen.getByText("Shlagbaum avtomatik ochilmadi (Chiqish), qo'lda oching"),
    ).toBeInTheDocument()
  })

  it("webhook_parse_failed kelganda togri yonalish bilan ogohlantirish korsatadi (regression)", async () => {
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    socketCallbacksRef.current!.onWebhookParseFailed?.(
      'entry',
      'Kamera signal yubordi, lekin format tanilmadi',
    )

    expect(
      await screen.findByText('Kamera signali tanilmadi'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Kamera signal yubordi, lekin format tanilmadi (Kirish)'),
    ).toBeInTheDocument()
  })
})

describe('OperatorDashboard exit candidate WebSocket va ruxsat oqimi', () => {
  beforeEach(() => {
    entryManualMock.mockReset()
    exitManualMock.mockReset()
    getActiveSessionsMock.mockReset().mockResolvedValue([])
    getCapacityMock.mockReset().mockResolvedValue({
      occupied: 0,
      total: null,
      available: null,
    })
    updateSessionPaymentMethodMock.mockReset()
    getAwaitingPaymentsMock.mockReset().mockResolvedValue([])
    confirmCashPaymentMock.mockReset()
    openBarrierForSessionMock.mockReset()
    getDailyReportMock.mockReset().mockResolvedValue({})
    getSettingsMock.mockReset().mockResolvedValue({})
    socketCallbacksRef.current = null
  })

  it('sessions ruxsati yo‘q operatorga candidate bo‘limini ko‘rsatmaydi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: false },
    })

    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    expect(
      screen.queryByTestId('exit-candidates-section'),
    ).not.toBeInTheDocument()
  })

  it('sessions ruxsati bor operatorga candidate bo‘limini ko‘rsatadi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })

    renderDashboard()

    expect(
      await screen.findByTestId('exit-candidates-section'),
    ).toBeInTheDocument()
  })

  it('created hodisasida cachega qo‘shadi, panelni ochadi va takroriy notification chiqarmaydi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    const queryClient = renderDashboard()
    queryClient.setQueryData(['exit-candidates', 'pending'], {
      candidates: [],
      pagination: { page: 1, limit: 100, total: 0, total_pages: 0 },
    })
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onExitCandidateCreated?.(pendingCandidate)
      socketCallbacksRef.current!.onExitCandidateCreated?.(pendingCandidate)
    })

    expect(
      screen.getByTestId('exit-candidates-section'),
    ).toHaveAttribute('data-selected-candidate', '7')
    expect(
      await screen.findAllByText('Yangi chiqish tekshiruvi'),
    ).toHaveLength(1)
    expect(
      queryClient.getQueryData<{
        candidates: ExitCandidate[]
        pagination: { total: number }
      }>(['exit-candidates', 'pending']),
    ).toMatchObject({ candidates: [{ id: 7 }], pagination: { total: 1 } })
  })

  it('resolved hodisasida candidate ni cachedan olib tashlaydi va ochiq panelni yopadi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    const queryClient = renderDashboard()
    queryClient.setQueryData(['exit-candidates', 'pending'], {
      candidates: [pendingCandidate],
      pagination: { page: 1, limit: 100, total: 1, total_pages: 1 },
    })
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())
    act(() => {
      socketCallbacksRef.current!.onExitCandidateCreated?.(pendingCandidate)
    })
    expect(screen.getByTestId('exit-candidates-section')).toHaveAttribute(
      'data-selected-candidate',
      '7',
    )

    act(() => {
      socketCallbacksRef.current!.onExitCandidateResolved?.({
        candidateId: 7,
        status: 'accepted',
        resolutionType: 'exact',
        sessionId: 44,
      })
    })

    expect(screen.getByTestId('exit-candidates-section')).toHaveAttribute(
      'data-selected-candidate',
      '',
    )
    expect(
      queryClient.getQueryData<{
        candidates: ExitCandidate[]
        pagination: { total: number }
      }>(['exit-candidates', 'pending']),
    ).toMatchObject({ candidates: [], pagination: { total: 0 } })
  })
})
