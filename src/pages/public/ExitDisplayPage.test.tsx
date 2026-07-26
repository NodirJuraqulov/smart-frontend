import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ExitDisplayPage from './ExitDisplayPage'
import { formatDate } from '@/utils/format'
import type { DisplayStatus } from '@/types/publicDisplay'

interface SocketCallbacks {
  onExitAwaitingPayment?: (
    plateNumber: string,
    amount: number,
    enteredAt: string,
    durationMinutes: number,
  ) => void
  onExitCompleted?: (plateNumber: string, amount: number) => void
  onPlateNotRecognized?: (plateNumber: string, message: string) => void
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

const status: DisplayStatus = {
  orgName: 'Chorsu Stoyanka',
  pricingMode: 'hourly',
  capacity: { occupied: 3, total: 10 },
  hourlyTariff: { price: 5000, gracePeriodMinutes: 15 },
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
    socketCallbacksRef.current = null
    isConnectedRef.current = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("oddiy holatda chiqish xabarini korsatadi", async () => {
    renderPage()

    expect(
      await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring'),
    ).toBeInTheDocument()
  })

  it("exit_awaiting_payment kelganda nomer, summa va turgan vaqtni korsatadi (regression)", async () => {
    renderPage()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onExitAwaitingPayment?.(
        '01A123BC',
        15000,
        '2026-07-18T08:00:00.000Z',
        90,
      )
    })

    expect(screen.getByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByText("15 000 so'm")).toBeInTheDocument()
    expect(
      screen.getByText("Turgan vaqt: 1 soat 30 daqiqa"),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`Kirgan vaqt: ${formatDate('2026-07-18T08:00:00.000Z')}`),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Operator kutmoqda, iltimos kuting'),
    ).toBeInTheDocument()
  })

  it("exit_completed kelganda rahmat xabarini korsatadi va vaqt tugagach oddiy holatga qaytadi (regression)", async () => {
    renderPage()
    await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring')
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    vi.useFakeTimers()

    act(() => {
      socketCallbacksRef.current!.onExitCompleted?.('01A123BC', 15000)
    })

    expect(screen.getByText('Rahmat, yaxshi yo\'l!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(
      screen.getByText('Chiqish uchun mashinangizni yaqinlashtiring'),
    ).toBeInTheDocument()
  })

  it("plate_not_recognized_for_exit kelganda operator bilan boglanish xabarini korsatadi", async () => {
    renderPage()
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onPlateNotRecognized?.(
        '01A123BC',
        'Operator bilan bog\'laning',
      )
    })

    expect(screen.getByText('Nomer aniqlanmadi')).toBeInTheDocument()
    expect(screen.getByText('Operator bilan bog\'laning')).toBeInTheDocument()
  })

  it("ulanish uzilganda indikator korsatadi", async () => {
    isConnectedRef.current = false
    renderPage()

    expect(await screen.findByText('Ulanish yo\'q')).toBeInTheDocument()
  })

  it("getDisplayStatus xato bersa qayta yuklash haqidagi xabarni korsatadi", async () => {
    getDisplayStatusMock.mockReset().mockRejectedValue(new Error('network error'))
    renderPage()

    expect(
      await screen.findByText(
        "Ma'lumot yuklanmadi. Sahifa 30 soniyadan keyin qayta yuklanadi",
      ),
    ).toBeInTheDocument()
  })

  it("unmount qilinganda rahmat xabari taymeri tozalanadi (memory leak yoq) (regression)", async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { unmount } = renderPage()

    await screen.findByText('Chiqish uchun mashinangizni yaqinlashtiring')
    await waitFor(() => expect(socketCallbacksRef.current).not.toBeNull())

    act(() => {
      socketCallbacksRef.current!.onExitCompleted?.('01A123BC', 15000)
    })

    const callsBeforeUnmount = clearTimeoutSpy.mock.calls.length
    unmount()

    expect(clearTimeoutSpy.mock.calls.length).toBeGreaterThan(
      callsBeforeUnmount,
    )
    clearTimeoutSpy.mockRestore()
  })
})
