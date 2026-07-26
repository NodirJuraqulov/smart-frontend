import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EntryDisplayPage from './EntryDisplayPage'
import type { DisplayStatus } from '@/types/publicDisplay'

interface SocketCallbacks {
  onEntryDetected?: (plateNumber: string, enteredAt: string) => void
  onParkingFull?: (plateNumber: string) => void
  onExitCompleted?: (plateNumber: string, amount: number) => void
  onExitAwaitingPayment?: (plateNumber: string, amount: number) => void
}

const { getDisplayStatusMock, socketCallbacksRef, isConnectedRef } = vi.hoisted(
  () => ({
    getDisplayStatusMock: vi.fn(),
    socketCallbacksRef: { current: null as SocketCallbacks | null },
    isConnectedRef: { current: true },
  }),
)

vi.mock('@/api/publicDisplay', () => ({
  getDisplayStatus: getDisplayStatusMock,
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
  capacity: { occupied: 3, total: 10 },
  hourlyTariff: { price: 5000, gracePeriodMinutes: 15 },
}

const intervalStatus: DisplayStatus = {
  orgName: 'Chorsu Stoyanka',
  pricingMode: 'interval',
  capacity: { occupied: 5, total: 10 },
  intervalTariffs: [
    { fromMinutes: 0, toMinutes: 60, price: 3000 },
    { fromMinutes: 60, toMinutes: null, price: 5000 },
  ],
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
    getDisplayStatusMock.mockReset()
    socketCallbacksRef.current = null
    isConnectedRef.current = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("soatlik narx va sigimni korsatadi", async () => {
    getDisplayStatusMock.mockResolvedValue(hourlyStatus)
    renderPage()

    expect(await screen.findByText('Chorsu Stoyanka')).toBeInTheDocument()
    expect(screen.getByText("5 000 so'm / soat")).toBeInTheDocument()
    expect(
      screen.getByText('Birinchi 15 daqiqa bepul'),
    ).toBeInTheDocument()
    expect(screen.getByText(/3 \/ 10/)).toBeInTheDocument()
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
      capacity: { occupied: 10, total: 10 },
    })
    renderPage()

    expect(await screen.findByText("Stoyanka to'liq")).toBeInTheDocument()
  })

  it("entry_detected kelganda xush kelibsiz xabarini korsatadi va vaqt tugagach yopiladi (regression)", async () => {
    getDisplayStatusMock.mockResolvedValue(hourlyStatus)
    renderPage()

    await screen.findByText("5 000 so'm / soat")
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    vi.useFakeTimers()

    act(() => {
      socketCallbacksRef.current!.onEntryDetected?.(
        '01A123BC',
        '2026-07-25T10:00:00Z',
      )
    })

    expect(screen.getByText('Xush kelibsiz, 01A123BC!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(
      screen.queryByText('Xush kelibsiz, 01A123BC!'),
    ).not.toBeInTheDocument()
  })

  it("ulanish uzilganda indikator korsatadi", async () => {
    isConnectedRef.current = false
    getDisplayStatusMock.mockResolvedValue(hourlyStatus)
    renderPage()

    expect(await screen.findByText('Ulanish yo\'q')).toBeInTheDocument()
  })

  it("getDisplayStatus xato bersa qayta yuklash haqidagi xabarni korsatadi", async () => {
    getDisplayStatusMock.mockRejectedValue(new Error('network error'))
    renderPage()

    expect(
      await screen.findByText(
        "Ma'lumot yuklanmadi. Sahifa 30 soniyadan keyin qayta yuklanadi",
      ),
    ).toBeInTheDocument()
  })

  it("unmount qilinganda xush kelibsiz taymeri tozalanadi (memory leak yoq) (regression)", async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    getDisplayStatusMock.mockResolvedValue(hourlyStatus)
    const { unmount } = renderPage()

    await screen.findByText("5 000 so'm / soat")
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onEntryDetected?.(
        '01A123BC',
        '2026-07-25T10:00:00Z',
      )
    })

    const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length
    unmount()

    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(
      callsBeforeUnmount,
    )
    clearTimeoutSpy.mockRestore()
  })
})
