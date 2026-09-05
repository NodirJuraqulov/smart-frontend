import { describe, expect, it } from 'vitest'
import {
  isCardPaymentStartedEvent,
  isExitPaymentDeclinedEvent,
} from './cardPayment'
import { isExitCompletedEvent } from './exitCandidate'
import { isExitDisplayFlowStatus } from './publicDisplay'
import type { PaymentMethod } from './parking'

describe('card payment runtime contracts', () => {
  it('PaymentMethod va exit validator card qiymatini qabul qiladi', () => {
    const paymentMethod: PaymentMethod = 'card'

    expect(paymentMethod).toBe('card')
    expect(
      isExitCompletedEvent({
        orgId: 3,
        sessionId: 44,
        plateNumber: '01A777BA',
        amount: 12000,
        paymentMethod,
        barrierStatus: 'opened',
      }),
    ).toBe(true)
  })

  it('public display validator awaiting_payment va card qiymatlarini qabul qiladi', () => {
    expect(
      isExitDisplayFlowStatus({
        state: 'awaiting_payment',
        plate: '01A777BA',
        barrier_status: null,
        updated_at: '2026-09-05T08:00:00.000Z',
        session_source: 'regular',
        amount: 12000,
        payment_method: 'card',
        duration_minutes: 30,
      }),
    ).toBe(true)
  })

  it('yangi WebSocket eventlarining camelCase payloadlarini tekshiradi', () => {
    expect(
      isCardPaymentStartedEvent({
        orgId: 3,
        sessionId: 44,
        candidateId: 7,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      }),
    ).toBe(true)
    expect(
      isExitPaymentDeclinedEvent({
        orgId: 3,
        sessionId: 44,
        operationNumber: 'op-1',
        reason: 'declined',
        errorMessage: 'Declined',
      }),
    ).toBe(true)
    expect(
      isCardPaymentStartedEvent({
        session_id: 44,
        operation_number: 'op-1',
      }),
    ).toBe(false)
  })
})
