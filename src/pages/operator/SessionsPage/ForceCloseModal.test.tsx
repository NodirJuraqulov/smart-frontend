import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ForceCloseModal from './ForceCloseModal'
import type { ParkingSession, Payment } from '@/types/parking'

const { forceCloseSessionMock } = vi.hoisted(() => ({
  forceCloseSessionMock: vi.fn(),
}))

vi.mock('@/api/parking', () => ({
  forceCloseSession: forceCloseSessionMock,
}))

const session: ParkingSession = {
  id: 7,
  org_id: 1,
  plate_number: '01A777BA',
  entered_at: '2026-07-20T06:00:00.000Z',
  exited_at: null,
  duration_minutes: null,
  amount: null,
  status: 'active',
  entry_method: 'auto',
  exit_method: null,
  image_entry: null,
  image_exit: null,
  operator_id: null,
  created_at: '2026-07-20T06:00:00.000Z',
}

const payment: Payment = {
  id: 3,
  org_id: 1,
  session_id: 7,
  amount: 12000,
  payment_method: 'cash',
  paid_at: '2026-07-20T09:00:00.000Z',
}

function renderModal(onForceClosed: (data: { session: ParkingSession; payment: Payment }) => void) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ForceCloseModal
          session={session}
          onClose={() => {}}
          onForceClosed={onForceClosed}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ForceCloseModal', () => {
  beforeEach(() => {
    forceCloseSessionMock.mockReset()
  })

  it('muvaffaqiyatli force-close dan song onForceClosed session+payment bilan chaqiriladi (regression)', async () => {
    const closedSession: ParkingSession = { ...session, status: 'completed' }
    forceCloseSessionMock.mockResolvedValue({ session: closedSession, payment })
    const onForceClosed = vi.fn()
    renderModal(onForceClosed)

    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ha, yopish' }))

    await waitFor(() => expect(onForceClosed).toHaveBeenCalledTimes(1))
    expect(onForceClosed).toHaveBeenCalledWith({ session: closedSession, payment })
  })

  it("payment_method Radio orqali tanlanib payload'ga qo'shiladi (regression)", async () => {
    const closedSession: ParkingSession = { ...session, status: 'completed' }
    forceCloseSessionMock.mockResolvedValue({ session: closedSession, payment })
    renderModal(vi.fn())

    fireEvent.click(screen.getByRole('radio', { name: 'Online' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ha, yopish' }))

    await waitFor(() => expect(forceCloseSessionMock).toHaveBeenCalledTimes(1))
    expect(forceCloseSessionMock.mock.calls[0][1]).toMatchObject({
      payment_method: 'online',
    })
  })

  it('forceCloseSession xato bersa onForceClosed chaqirilmaydi', async () => {
    forceCloseSessionMock.mockRejectedValue(new Error('boom'))
    const onForceClosed = vi.fn()
    renderModal(onForceClosed)

    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ha, yopish' }))

    await waitFor(() => expect(forceCloseSessionMock).toHaveBeenCalledTimes(1))
    expect(onForceClosed).not.toHaveBeenCalled()
  })

  it("'Bekor qilish' bosilgandan keyin boshqa sessiya uchun ochilganda Summa maydoni bo'sh bo'ladi (regression)", async () => {
    const queryClient = new QueryClient()
    const wrapper = (session: ParkingSession) => (
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <ForceCloseModal
            session={session}
            onClose={() => {}}
            onForceClosed={vi.fn()}
          />
        </AntdApp>
      </QueryClientProvider>
    )
    const { rerender } = render(wrapper(session))

    fireEvent.change(screen.getByPlaceholderText("Bo'sh qoldiring"), {
      target: { value: '99999' },
    })
    expect(screen.getByDisplayValue('99999')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    rerender(wrapper({ ...session, id: 8, plate_number: '01B999CC' }))

    expect(screen.queryByDisplayValue('99999')).not.toBeInTheDocument()
  })
})
