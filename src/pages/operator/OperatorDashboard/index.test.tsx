import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import OperatorDashboard from './index'
import type { DetectionType } from '@/types/parking'
import type {
  ExitCompletedEvent,
  ExitCandidateCreatedEvent,
  ExitCandidateResolvedEvent,
} from '@/types/exitCandidate'
import type {
  EntryCandidateCreatedEvent,
  EntryCandidateResolvedEvent,
} from '@/types/entryCandidate'

interface SocketCallbacks {
  onEntry?: (...args: unknown[]) => void
  onExit?: (...args: unknown[]) => void
  onDetectionFailed?: (type: DetectionType, imageUrl: string) => void
  onExitCompleted?: (payload: ExitCompletedEvent) => void
  onExitCandidateCreated?: (candidate: ExitCandidateCreatedEvent) => void
  onExitCandidateResolved?: (payload: ExitCandidateResolvedEvent) => void
  onEntryCandidateCreated?: (candidate: EntryCandidateCreatedEvent) => void
  onEntryCandidateResolved?: (payload: EntryCandidateResolvedEvent) => void
  onRelayFailed?: (direction: 'entry' | 'exit', message: string) => void
  onWebhookParseFailed?: (direction: 'entry' | 'exit', message: string) => void
}

const {
  entryManualMock,
  exitManualMock,
  getActiveSessionsMock,
  getCapacityMock,
  updateSessionPaymentMethodMock,
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

vi.mock('./ExitCandidateWorkflow', () => ({
  default: ({
    newCandidateSignal,
    statusRefreshSignal,
    resolvedCandidateId,
  }: {
    newCandidateSignal: number
    statusRefreshSignal: number
    resolvedCandidateId: number | null
  }) => (
    <div
      data-testid="exit-candidate-workflow"
      data-new-candidate-signal={newCandidateSignal}
      data-status-refresh-signal={statusRefreshSignal}
      data-resolved-candidate={resolvedCandidateId ?? ''}
    />
  ),
}))

vi.mock('./EntryCandidateWorkflow', () => ({
  default: ({
    newCandidateSignal,
    statusRefreshSignal,
    resolvedCandidateId,
  }: {
    newCandidateSignal: number
    statusRefreshSignal: number
    resolvedCandidateId: string | null
  }) => (
    <div
      data-testid="entry-candidate-workflow"
      data-new-candidate-signal={newCandidateSignal}
      data-status-refresh-signal={statusRefreshSignal}
      data-resolved-candidate={resolvedCandidateId ?? ''}
    />
  ),
}))

vi.mock('./ManualParkingEntryModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Qo‘lda kirish qo‘shish</div> : null,
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

const pendingCandidate: ExitCandidateCreatedEvent = {
  candidateId: 7,
  orgId: 3,
  webhookEventId: 91,
  detectedPlate: '01A777BA',
  matchedSessionId: 44,
  confidence: 98.2,
  cameraEventAt: '2026-08-01T08:00:00.000Z',
  status: 'pending',
  exitImages: {
    overviewUrl: '/api/exit-overview',
    vehicleUrl: '/api/exit-vehicle',
    plateUrl: '/api/exit-plate',
  },
}

const pendingEntryCandidate: EntryCandidateCreatedEvent = {
  candidateId: 17,
  orgId: 3,
  detectedPlate: '01B555BB',
  cameraEventAt: '2026-08-02T08:00:00.000Z',
  confidence: 97,
  entryImages: {
    overviewUrl: '/api/entry-overview',
    vehicleUrl: null,
    imageAvailable: true,
  },
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
      screen.queryByTestId('exit-candidate-workflow'),
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
      await screen.findByTestId('exit-candidate-workflow'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('entry-candidate-workflow')).toBeInTheDocument()
  })

  it('Qo‘lda kirish qo‘shish tugmasi yangi modalni ochadi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    renderDashboard()

    fireEvent.click(
      await screen.findByRole('button', { name: 'Qo‘lda kirish qo‘shish' }),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Qo‘lda kirish qo‘shish',
    )
  })

  it('entry candidate WebSocket hodisalari entry badge signallarini yangilaydi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onEntryCandidateCreated?.(
        pendingEntryCandidate,
      )
      socketCallbacksRef.current!.onEntryCandidateResolved?.({
        candidateId: 17,
        orgId: 1,
        status: 'accepted',
        sessionId: 101,
        barrierStatus: 'opened',
      })
    })

    const workflow = screen.getByTestId('entry-candidate-workflow')
    expect(workflow).toHaveAttribute('data-new-candidate-signal', '1')
    expect(workflow).toHaveAttribute('data-status-refresh-signal', '1')
    expect(workflow).toHaveAttribute('data-resolved-candidate', '17')
  })

  it('created hodisasida workflow signalini yangilaydi va notificationni takrorlamaydi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onExitCandidateCreated?.(pendingCandidate)
      socketCallbacksRef.current!.onExitCandidateCreated?.(pendingCandidate)
    })

    expect(
      screen.getByTestId('exit-candidate-workflow'),
    ).toHaveAttribute('data-new-candidate-signal', '2')
    expect(
      await screen.findAllByText('Yangi chiqish tekshiruvi'),
    ).toHaveLength(1)
  })

  it('resolved hodisasida badge refresh va resolved candidate signalini yangilaydi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onExitCandidateResolved?.({
        candidateId: 7,
        orgId: 3,
        status: 'accepted',
        resolutionType: 'exact',
        sessionId: 44,
        barrierStatus: 'opened',
      })
    })

    const workflow = screen.getByTestId('exit-candidate-workflow')
    expect(workflow).toHaveAttribute(
      'data-resolved-candidate',
      '7',
    )
    expect(workflow).toHaveAttribute('data-status-refresh-signal', '1')
  })

  it('exit_completed hodisasida badge refresh signalini yangilaydi', async () => {
    useAppSelectorMock.mockReset().mockReturnValue({
      role: 'operator',
      org_name: 'Test parking',
      permissions: { can_view_sessions: true },
    })
    renderDashboard()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onExitCompleted?.({
        orgId: 3,
        sessionId: 44,
        plateNumber: '01A777BA',
        amount: 0,
        paymentMethod: null,
        barrierStatus: 'opened',
      })
    })

    expect(screen.getByTestId('exit-candidate-workflow')).toHaveAttribute(
      'data-status-refresh-signal',
      '1',
    )
  })
})
