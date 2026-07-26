import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import HistorySessionsTab from './HistorySessionsTab'
import type { ParkingSession, SessionsResponse } from '@/types/parking'

const { getSessionsMock, printReceiptForSessionMock, useAppSelectorMock } =
  vi.hoisted(() => ({
    getSessionsMock: vi.fn(),
    printReceiptForSessionMock: vi.fn(),
    useAppSelectorMock: vi.fn(),
  }))

vi.mock('@/api/parking', () => ({
  getSessions: getSessionsMock,
  printReceiptForSession: printReceiptForSessionMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

const completedSession: ParkingSession = {
  id: 1,
  org_id: 1,
  plate_number: '01A123BC',
  entered_at: '2026-07-18T08:00:00.000Z',
  exited_at: '2026-07-18T09:00:00.000Z',
  duration_minutes: 60,
  amount: 15000,
  status: 'completed',
  entry_method: 'auto',
  exit_method: 'manual',
  image_entry: null,
  image_exit: null,
  operator_id: null,
  created_at: '2026-07-18T08:00:00.000Z',
}

const response: SessionsResponse = {
  sessions: [completedSession],
  pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
}

function renderTab() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdApp>
          <HistorySessionsTab />
        </AntdApp>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

async function openReceiptAndPrint() {
  fireEvent.click(await screen.findByRole('button', { name: /Chek$/ }))
  fireEvent.click(await screen.findByRole('button', { name: /Chek chiqarish/ }))
}

describe('HistorySessionsTab reprint', () => {
  beforeEach(() => {
    getSessionsMock.mockReset().mockResolvedValue(response)
    printReceiptForSessionMock.mockReset()
    useAppSelectorMock.mockReset().mockReturnValue('Chorsu Stoyanka')
  })

  it("muvaffaqiyatli chop etilganda togri id bilan chaqiradi va xabar korsatadi (regression)", async () => {
    printReceiptForSessionMock.mockResolvedValue({ success: true })
    renderTab()

    await openReceiptAndPrint()

    await waitFor(() =>
      expect(printReceiptForSessionMock).toHaveBeenCalledWith(1),
    )
    expect(await screen.findByText('Chek chop etildi')).toBeInTheDocument()
  })

  it("printer sozlanmagan bolsa mos ogohlantirish korsatadi", async () => {
    printReceiptForSessionMock.mockResolvedValue({
      success: false,
      reason: 'printer_not_configured',
    })
    renderTab()

    await openReceiptAndPrint()

    expect(
      await screen.findByText('Printer sozlanmagan'),
    ).toBeInTheDocument()
  })

  it("boshqa xato bolsa umumiy xato xabarini korsatadi", async () => {
    printReceiptForSessionMock.mockRejectedValue(new Error('network error'))
    renderTab()

    await openReceiptAndPrint()

    expect(
      await screen.findByText("Chekni chop etib bo'lmadi"),
    ).toBeInTheDocument()
  })
})
