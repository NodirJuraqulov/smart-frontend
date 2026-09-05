import { createContext } from 'react'
import type {
  CardPaymentStartedEvent,
  ExitPaymentDeclinedEvent,
} from '@/types/cardPayment'

export interface DeclinedCardPayment extends ExitPaymentDeclinedEvent {
  sessionId: number
  candidateId: number | null
  plateNumber: string | null
}

export interface CardPaymentContextValue {
  pendingPayments: ReadonlyMap<number, CardPaymentStartedEvent>
  declinedPayments: ReadonlyMap<number, DeclinedCardPayment>
  isCardTerminalEnabled: boolean
  isCardPending: (sessionId: number) => boolean
  markRetryStarted: (payment: CardPaymentStartedEvent) => void
  clearDeclined: (sessionId: number) => void
}

export const CardPaymentContext = createContext<CardPaymentContextValue>({
  pendingPayments: new Map<number, CardPaymentStartedEvent>(),
  declinedPayments: new Map<number, DeclinedCardPayment>(),
  isCardTerminalEnabled: false,
  isCardPending: () => false,
  markRetryStarted: () => undefined,
  clearDeclined: () => undefined,
})
