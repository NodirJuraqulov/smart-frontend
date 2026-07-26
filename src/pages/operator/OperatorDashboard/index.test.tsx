import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import OperatorDashboard from './index'
import type { DetectionType } from '@/types/parking'

interface SocketCallbacks {
  onEntry?: (...args: unknown[]) => void
  onExit?: (...args: unknown[]) => void
  onDetectionFailed?: (type: DetectionType, imageUrl: string) => void
  onAwaitingPayment?: (...args: unknown[]) => void
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

function renderDashboard() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <OperatorDashboard />
      </AntdApp>
    </QueryClientProvider>,
  )
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
    getCapacityMock.mockReset().mockResolvedValue({ occupied: 0, total: null })
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
    getCapacityMock.mockReset().mockResolvedValue({ occupied: 0, total: null })
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
