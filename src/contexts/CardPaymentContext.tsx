import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { useTranslation } from 'react-i18next'
import { getCardTerminalSettings } from '@/api/organizations'
import { useParkingSocket } from '@/hooks/useParkingSocket'
import { useAppSelector } from '@/hooks/redux'
import {
  CardPaymentContext,
  type CardPaymentContextValue,
  type DeclinedCardPayment,
} from './cardPaymentState'
import type { CardPaymentStartedEvent } from '@/types/cardPayment'

function paymentDescription(
  plateNumber: string | null,
  label: string,
  errorMessage?: string | null,
) {
  return [plateNumber ? `${label}: ${plateNumber}` : null, errorMessage]
    .filter(Boolean)
    .join(' — ')
}

export function CardPaymentProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { notification } = AntdApp.useApp()
  const user = useAppSelector((state) => state.auth.user)
  const orgId = user?.org_id ?? null
  const canUseCardPayments =
    user?.role === 'operator' || user?.role === 'owner'
  const [pendingPayments, setPendingPayments] = useState(
    () => new Map<number, CardPaymentStartedEvent>(),
  )
  const [declinedPayments, setDeclinedPayments] = useState(
    () => new Map<number, DeclinedCardPayment>(),
  )
  const pendingPaymentsRef = useRef(pendingPayments)

  const settingsQuery = useQuery({
    queryKey: ['organizations', orgId, 'card-terminal-settings'],
    queryFn: () => getCardTerminalSettings(orgId!),
    enabled: orgId != null && canUseCardPayments,
    retry: false,
  })

  useEffect(() => {
    const emptyPending = new Map<number, CardPaymentStartedEvent>()
    pendingPaymentsRef.current = emptyPending
    setPendingPayments(emptyPending)
    setDeclinedPayments(new Map<number, DeclinedCardPayment>())
  }, [orgId])

  const addPending = useCallback((payment: CardPaymentStartedEvent) => {
    setPendingPayments((current) => {
      const next = new Map(current)
      next.set(payment.sessionId, payment)
      pendingPaymentsRef.current = next
      return next
    })
    setDeclinedPayments((current) => {
      if (!current.has(payment.sessionId)) return current
      const next = new Map(current)
      next.delete(payment.sessionId)
      return next
    })
  }, [])

  const removePending = useCallback((sessionId: number) => {
    setPendingPayments((current) => {
      if (!current.has(sessionId)) return current
      const next = new Map(current)
      next.delete(sessionId)
      pendingPaymentsRef.current = next
      return next
    })
  }, [])

  const clearDeclined = useCallback((sessionId: number) => {
    setDeclinedPayments((current) => {
      if (!current.has(sessionId)) return current
      const next = new Map(current)
      next.delete(sessionId)
      return next
    })
  }, [])

  useParkingSocket({
    onCardPaymentStarted: (payload) => {
      addPending(payload)
      notification.info({
        title: t('paymentMethod.cardPaymentStarted'),
        description: paymentDescription(
          payload.plateNumber,
          t('sessions.columnPlate'),
        ),
        placement: 'topRight',
        duration: 6,
      })
    },
    onExitPaymentDeclined: (payload) => {
      const pending =
        (payload.sessionId != null
          ? pendingPaymentsRef.current.get(payload.sessionId)
          : undefined) ??
        [...pendingPaymentsRef.current.values()].find(
          (payment) => payment.operationNumber === payload.operationNumber,
        )
      const sessionId = payload.sessionId ?? pending?.sessionId ?? null
      if (sessionId != null) {
        removePending(sessionId)
        setDeclinedPayments((current) => {
          const next = new Map(current)
          next.set(sessionId, {
            ...payload,
            sessionId,
            candidateId: pending?.candidateId ?? null,
            plateNumber: pending?.plateNumber ?? null,
          })
          return next
        })
      }
      notification.error({
        title: t('paymentMethod.cardPaymentDeclined'),
        description: paymentDescription(
          pending?.plateNumber ?? null,
          t('sessions.columnPlate'),
          payload.errorMessage,
        ),
        placement: 'topRight',
        duration: 8,
      })
    },
    onExitCompleted: (payload) => {
      removePending(payload.sessionId)
      clearDeclined(payload.sessionId)
      if (payload.paymentMethod !== 'card') return
      notification.success({
        title: t('paymentMethod.cardPaymentSuccess'),
        description: paymentDescription(
          payload.plateNumber,
          t('sessions.columnPlate'),
        ),
        placement: 'topRight',
        duration: 8,
      })
    },
  })

  const value = useMemo<CardPaymentContextValue>(
    () => {
      const isCardTerminalEnabled =
        settingsQuery.data?.card_terminal_enabled === true
      return {
        pendingPayments,
        declinedPayments,
        isCardTerminalEnabled,
        isCardPending: (sessionId) =>
          isCardTerminalEnabled && pendingPayments.has(sessionId),
        markRetryStarted: addPending,
        clearDeclined,
      }
    },
    [
      addPending,
      clearDeclined,
      declinedPayments,
      pendingPayments,
      settingsQuery.data?.card_terminal_enabled,
    ],
  )

  return (
    <CardPaymentContext.Provider value={value}>
      {children}
    </CardPaymentContext.Provider>
  )
}
