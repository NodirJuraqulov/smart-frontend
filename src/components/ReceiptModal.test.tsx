import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ReceiptModal from '@/components/ReceiptModal'
import { formatDate } from '@/utils/format'
import type { ParkingSession } from '@/types/parking'

const baseSession: ParkingSession = {
  id: 1,
  org_id: 1,
  plate_number: '01A123BC',
  entered_at: '2026-07-18T08:30:00.000Z',
  exited_at: '2026-07-18T09:15:00.000Z',
  duration_minutes: 45,
  amount: 15000,
  status: 'completed',
  entry_method: 'auto',
  exit_method: 'manual',
  image_entry: null,
  image_exit: null,
  operator_id: null,
  created_at: '2026-07-18T08:30:00.000Z',
}

describe('ReceiptModal', () => {
  it("to'g'ri sanani formatlab korsatadi", () => {
    render(
      <ReceiptModal
        open
        onClose={() => {}}
        session={baseSession}
        amount={15000}
        paymentMethod="cash"
        orgName="Chorsu Stoyanka"
      />,
    )

    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument()
    expect(screen.getByText(formatDate(baseSession.entered_at))).toBeInTheDocument()
    expect(screen.getByText(formatDate(baseSession.exited_at))).toBeInTheDocument()
    expect(screen.getByText('Chorsu Stoyanka')).toBeInTheDocument()
  })

  it('orgName bolmasa sarlavha sifatida receiptTitle korsatiladi', () => {
    render(
      <ReceiptModal
        open
        onClose={() => {}}
        session={baseSession}
        amount={15000}
        paymentMethod="cash"
      />,
    )

    expect(screen.getByRole('heading', { name: 'Chek' })).toBeInTheDocument()
  })

  it('yaroqsiz sana xato tashlamasdan "—" korsatadi (regression)', () => {
    const brokenSession: ParkingSession = {
      ...baseSession,
      entered_at: 'not-a-real-date',
    }

    expect(() =>
      render(
        <ReceiptModal
          open
          onClose={() => {}}
          session={brokenSession}
          amount={null}
          paymentMethod={null}
        />,
      ),
    ).not.toThrow()

    expect(screen.queryByText('Invalid Date')).not.toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it("qo'lda/majburan yopilgan sessiyada tolov turi FAQAT o'qish uchun korsatiladi", () => {
    render(
      <ReceiptModal
        open
        onClose={() => {}}
        session={{ ...baseSession, exit_method: 'manual' }}
        amount={15000}
        paymentMethod="online"
        onConfirmPaymentMethod={vi.fn()}
      />,
    )

    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it("avtomatik yopilgan sessiyada tolov turini tanlash Radio korinadi va Chop etishda tasdiqlanadi (regression)", () => {
    const onConfirmPaymentMethod = vi.fn()
    render(
      <ReceiptModal
        open
        onClose={() => {}}
        session={{ ...baseSession, exit_method: 'auto' }}
        amount={15000}
        paymentMethod={null}
        onConfirmPaymentMethod={onConfirmPaymentMethod}
      />,
    )

    expect(screen.getAllByRole('radio').length).toBe(2)

    fireEvent.click(screen.getByRole('radio', { name: 'Online' }))
    fireEvent.click(screen.getByRole('button', { name: /Chek chiqarish/ }))

    expect(onConfirmPaymentMethod).toHaveBeenCalledWith('online')
  })
})
