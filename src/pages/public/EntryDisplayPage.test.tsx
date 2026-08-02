import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EntryDisplayPage from './EntryDisplayPage'
import type {
  DisplayStatus,
  EntryDisplayFlowStatus,
} from '@/types/publicDisplay'

interface SocketCallbacks {
  onEntryStatusChanged?: (status: EntryDisplayFlowStatus) => void
}

const {
  getDisplayStatusMock,
  getEntryDisplayStatusMock,
  socketCallbacksRef,
  isConnectedRef,
} = vi.hoisted(() => ({
  getDisplayStatusMock: vi.fn(),
  getEntryDisplayStatusMock: vi.fn(),
  socketCallbacksRef: { current: null as SocketCallbacks | null },
  isConnectedRef: { current: true },
}))

vi.mock('@/api/publicDisplay', () => ({
  getDisplayStatus: getDisplayStatusMock,
  getEntryDisplayStatus: getEntryDisplayStatusMock,
}))

vi.mock('@/hooks/usePublicDisplaySocket', () => ({
  usePublicDisplaySocket: (_orgId: number, callbacks: SocketCallbacks) => {
    socketCallbacksRef.current = callbacks
    return isConnectedRef.current
  },
}))

const hourlyStatus: DisplayStatus = {
  orgName: 'Chorsu Stoyanka',
  pricingMode: 'hourly',
  capacity: { occupied: 3, total: 10, available: 7 },
  hourlyTariff: { price: 5000, gracePeriodMinutes: 15 },
}

const intervalStatus: DisplayStatus = {
  orgName: 'Chorsu Stoyanka',
  pricingMode: 'interval',
  capacity: { occupied: 5, total: 10, available: 5 },
  intervalTariffs: [
    { fromMinutes: 0, toMinutes: 60, price: 3000 },
    { fromMinutes: 60, toMinutes: null, price: 5000 },
  ],
}

const idleFlow: EntryDisplayFlowStatus = {
  state: 'idle',
  plate: null,
  barrier_status: null,
  updated_at: '2026-08-02T10:00:00.000Z',
}

function renderPage(orgId = 5) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/display/entry/${orgId}`]}>
        <Routes>
          <Route path="/display/entry/:orgId" element={<EntryDisplayPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('EntryDisplayPage', () => {
  beforeEach(() => {
    getDisplayStatusMock.mockReset().mockResolvedValue(hourlyStatus)
    getEntryDisplayStatusMock.mockReset().mockResolvedValue(idleFlow)
    socketCallbacksRef.current = null
    isConnectedRef.current = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("soatlik narx va sigimni korsatadi", async () => {
    const { container } = renderPage()

    expect(await screen.findByText('Chorsu Stoyanka')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('min-h-screen')
    expect(screen.getByText("5 000 so'm / soat")).toBeInTheDocument()
    expect(screen.getByText('Birinchi 15 daqiqa bepul')).toBeInTheDocument()
    expect(screen.getByText(/3 \/ 10/)).toBeInTheDocument()
    expect(screen.getByText('Bo‘sh joylar: 7')).toBeInTheDocument()
  })

  it("interval tariflarni korsatadi", async () => {
    getDisplayStatusMock.mockResolvedValue(intervalStatus)
    renderPage()

    expect(await screen.findByText(/0–60 daqiqa/)).toBeInTheDocument()
    expect(screen.getByText(/60\+ daqiqa/)).toBeInTheDocument()
  })

  it("stoyanka toliq bolganda ogohlantirish korsatadi", async () => {
    getDisplayStatusMock.mockResolvedValue({
      ...hourlyStatus,
      capacity: { occupied: 10, total: 10, available: 0 },
    })
    renderPage()

    expect(await screen.findByText("Stoyanka to'liq")).toBeInTheDocument()
  })

  it("public socket candidate holatini korsatadi", async () => {
    renderPage()
    await screen.findByText("5 000 so'm / soat")
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current?.onEntryStatusChanged?.({
        state: 'awaiting_operator',
        plate: '01A123BC',
        barrier_status: null,
        updated_at: new Date().toISOString(),
      })
    })

    expect(
      await screen.findByText("Operator tasdig'i kutilmoqda"),
    ).toBeInTheDocument()
    expect(screen.getByText('01A123BC')).toBeInTheDocument()
  })

  it("completed holatini 15 soniyadan keyin yopadi", async () => {
    renderPage()
    await screen.findByText("5 000 so'm / soat")
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())
    act(() => {
      socketCallbacksRef.current?.onEntryStatusChanged?.({
        state: 'completed',
        plate: '01A123BC',
        barrier_status: 'opened',
        updated_at: new Date().toISOString(),
      })
    })

    expect(
      await screen.findByText('Xush kelibsiz, 01A123BC!'),
    ).toBeInTheDocument()

    act(() => {
      socketCallbacksRef.current?.onEntryStatusChanged?.({
        state: 'completed',
        plate: '01A123BC',
        barrier_status: 'opened',
        updated_at: new Date(Date.now() - 14_900).toISOString(),
      })
    })

    expect(await screen.findByText("5 000 so'm / soat")).toBeInTheDocument()
  })

  it("barrier failed holatida texnik tafsilotsiz neytral xabar korsatadi", async () => {
    getEntryDisplayStatusMock.mockResolvedValue({
      state: 'barrier_failed',
      plate: '01A123BC',
      barrier_status: 'failed',
      updated_at: new Date().toISOString(),
    })
    renderPage()

    expect(await screen.findByText('Iltimos, kuting')).toBeInTheDocument()
    expect(screen.getByText('Operator sizga yordam bermoqda')).toBeInTheDocument()
    expect(screen.queryByText(/shlagbaum/i)).not.toBeInTheDocument()
  })

  it("declined holatida sababni oshkor qilmaydi", async () => {
    getEntryDisplayStatusMock.mockResolvedValue({
      state: 'declined',
      plate: '01A123BC',
      barrier_status: null,
      updated_at: new Date().toISOString(),
    })
    renderPage()

    expect(
      await screen.findByText('Operator yordamida yakunlandi'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/tasdiqlanmadi/i)).not.toBeInTheDocument()
  })

  it("ulanish uzilganda indikator korsatadi", async () => {
    isConnectedRef.current = false
    renderPage()

    expect(await screen.findByText("Ulanish yo'q")).toBeInTheDocument()
  })

  it("status yuklanmasa xato xabarini korsatadi", async () => {
    getEntryDisplayStatusMock.mockRejectedValue(new Error('network error'))
    renderPage()

    expect(
      await screen.findByText(
        "Ma'lumot yuklanmadi. Qayta ulanilmoqda",
      ),
    ).toBeInTheDocument()
  })

  it("unmount qilinganda status taymerini tozalaydi", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const { unmount } = renderPage()
    await screen.findByText("5 000 so'm / soat")

    act(() => {
      socketCallbacksRef.current?.onEntryStatusChanged?.({
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
