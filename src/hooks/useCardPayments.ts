import { useContext } from 'react'
import { CardPaymentContext } from '@/contexts/cardPaymentState'

export function useCardPayments() {
  return useContext(CardPaymentContext)
}
