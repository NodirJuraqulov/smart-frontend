import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ExitDisplayPage from './ExitDisplayPage'
import type {
  DisplayStatus,
  ExitDisplayFlowStatus,
} from '@/types/publicDisplay'

interface SocketCallbacks {
  onExitStatusChanged?: (status: ExitDisplayFlowStatus) => void
}

const {
  getDisplayStatusMock,
  getExitDisplayStatusMock,
  socketCallbacksRef,
  isConnectedRef,
} = vi.hoisted(() => ({
  getDisplayStatusMock: vi.fn(),
  getExitDisplayStatusMock: vi.fn(),
  socketCallbacksRef: { current: null as SocketCallbacks | null },
  isConnectedRef: { current: true },
}))

vi.mock('@/api/publicDisplay', () => ({
  getDisplayStatus: getDisplayStatusMock,
  getExitDisplayStatus: getExitDisplayStatusMock,
}))

vi.mock('@/hooks/usePublicDisplaySocket', () => ({
  usePublicDisplaySocket: (_orgId: number, callbacks: SocketCallbacks) => {
    socketCallbacksRef.current = callbacks
    return isConnectedRef.current
  },
}))

const status: DisplayStatus = {
  orgName: 'Chorsu Stoyanka',
  pricingMode: 'hourly',
  capacity: { occupied: 3, total: 10, available: 7 },
  hourlyTariff: { price: 5000, gracePeriodMinutes: 15 },
}

const idleFlow: ExitDisplayFlowStatus = {
  state: 'idle',
  plate: null,
  session_source: null,
  amount: null,
  payment_method: null,
  duration_minutes: null,
  barrier_status: null,
  updated_at: '2026-08-02T10:00:00.000Z',
}

function renderPage(orgId = 5) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/display/exit/${orgId}`]}>
        <Routes>
          <Route path="/display/exit/:orgId" element={<ExitDisplayPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ExitDisplayPage', () => {
  beforeEach(() => {
    getDisplayStatusMock.mockReset().mockResolvedValue(status)
    getExitDisplayStatusMock.mockReset().mockResolvedValue(idleFlow)
    socketCallbacksRef.current = null
    isConnectedRef.current = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("idle holatida chiqish xabari bilan QR kodini ko‘rsatadi", async () => {
    const { container } = renderPage()

    expect(
      await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring'),
    ).toBeInTheDocument()
    expect(screen.getByAltText('To‘lov QR kodi')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('min-h-screen')
  })

  it("awaiting operator holatida operator matni va QR kodini birga ko‘rsatadi", async () => {
    renderPage()
    await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring')

    act(() => {
      socketCallbacksRef.current?.onExitStatusChanged?.({
        ...idleFlow,
        state: 'awaiting_operator',
        plate: '01A123BC',
        updated_at: new Date().toISOString(),
      })
    })

    expect(
      await screen.findByText("Operator tasdig'i kutilmoqda"),
    ).toBeInTheDocument()
    expect(screen.getByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByText('Operator siz bilan ishlamoqda')).toBeInTheDocument()
    expect(screen.getByAltText('To‘lov QR kodi')).toBeInTheDocument()
  })

  it("completed holatida yakun matni va QR kodini birga ko‘rsatadi", async () => {
    renderPage()
    await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring')
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())
    act(() => {
      socketCallbacksRef.current?.onExitStatusChanged?.({
        state: 'completed',
        plate: '01A123BC',
        session_source: 'regular',
        amount: 15000,
        payment_method: 'cash',
        duration_minutes: 90,
        barrier_status: 'opened',
        updated_at: new Date().toISOString(),
      })
    })

    expect(await screen.findByText("Rahmat, yaxshi yo'l!")).toBeInTheDocument()
    expect(screen.getByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByText("15 000 so'm")).toBeInTheDocument()
    expect(screen.getByText('Turgan vaqt: 1 soat 30 daqiqa')).toBeInTheDocument()
    expect(screen.getByText("To'lov usuli: naqd")).toBeInTheDocument()
    expect(screen.getByText('Onlayn to‘lov uchun skanerlang')).toBeInTheDocument()
    expect(screen.getByAltText('To‘lov QR kodi')).toHaveAttribute(
      'loading',
      'lazy',
    )
  })

  it("completed matni 15 soniyadan keyin yo‘qoladi, QR kodi esa qoladi", async () => {
    renderPage()
    await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring')
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current?.onExitStatusChanged?.({
        state: 'completed',
        plate: '01A123BC',
        session_source: 'regular',
        amount: 15000,
        payment_method: 'cash',
        duration_minutes: 90,
        barrier_status: 'opened',
        updated_at: new Date(Date.now() - 14_700).toISOString(),
      })
    })

    expect(await screen.findByText("Rahmat, yaxshi yo'l!")).toBeInTheDocument()
    expect(
      await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring'),
    ).toBeInTheDocument()
    expect(screen.queryByText("Rahmat, yaxshi yo'l!")).not.toBeInTheDocument()
    expect(screen.getByAltText('To‘lov QR kodi')).toBeInTheDocument()
  })

  it("online completed tolov usulini korsatadi", async () => {
    getExitDisplayStatusMock.mockResolvedValue({
      ...idleFlow,
      state: 'completed',
      plate: '01O777AA',
      session_source: 'regular',
      amount: 20000,
      payment_method: 'online',
      duration_minutes: 120,
      barrier_status: 'opened',
      updated_at: new Date().toISOString(),
    })
    renderPage()

    expect(await screen.findByText("To'lov usuli: online")).toBeInTheDocument()
  })

  it('VIP completed holatida to‘lov talab qilinmasligi bilan QR kodini ko‘rsatadi', async () => {
    getExitDisplayStatusMock.mockResolvedValue({
      ...idleFlow,
      state: 'completed',
      plate: '01V777IP',
      session_source: 'vip',
      amount: 0,
      duration_minutes: 45,
      barrier_status: 'opened',
      updated_at: new Date().toISOString(),
    })
    renderPage()

    expect(await screen.findByText('To‘lov talab qilinmaydi')).toBeInTheDocument()
    expect(screen.getByAltText('To‘lov QR kodi')).toBeInTheDocument()
  })

  it("barrier failed holatida neytral xabar va QR kodini birga ko‘rsatadi", async () => {
    getExitDisplayStatusMock.mockResolvedValue({
      ...idleFlow,
      state: 'barrier_failed',
      plate: '01A123BC',
      barrier_status: 'failed',
    })
    renderPage()

    expect(await screen.findByText('Iltimos, kuting')).toBeInTheDocument()
    expect(screen.getByText('Operator sizga yordam bermoqda')).toBeInTheDocument()
    expect(screen.queryByText(/shlagbaum/i)).not.toBeInTheDocument()
    expect(screen.getByAltText('To‘lov QR kodi')).toBeInTheDocument()
  })

  it("force open yakunini umumiy xabar bilan korsatadi", async () => {
    getExitDisplayStatusMock.mockResolvedValue({
      ...idleFlow,
      state: 'declined',
      plate: '01A123BC',
      barrier_status: 'opened',
      updated_at: new Date().toISOString(),
    })
    renderPage()

    expect(
      await screen.findByText('Operator yordamida yakunlandi'),
    ).toBeInTheDocument()
  })

  it("ulanish uzilganda indikator korsatadi", async () => {
    isConnectedRef.current = false
    renderPage()

    expect(await screen.findByText("Ulanish yo'q")).toBeInTheDocument()
  })

  it("status yuklanmasa xato xabarini korsatadi", async () => {
    getExitDisplayStatusMock.mockRejectedValue(new Error('network error'))
    renderPage()

    expect(
      await screen.findByText(
        "Ma'lumot yuklanmadi. Qayta ulanilmoqda",
      ),
    ).toBeInTheDocument()
  })

  it("unmount qilinganda status taymerini tozalaydi", async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { unmount } = renderPage()
    await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring')

    act(() => {
      socketCallbacksRef.current?.onExitStatusChanged?.({
        ...idleFlow,
        state: 'completed',
        plate: '01A123BC',
        barrier_status: 'opened',
        updated_at: new Date().toISOString(),
      })
    })

    const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length
    unmount()
    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(callsBeforeUnmount)
    clearTimeoutSpy.mockRestore()
  })
})
