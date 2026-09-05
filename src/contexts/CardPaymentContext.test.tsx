import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CardPaymentProvider } from './CardPaymentContext'
import { useCardPayments } from '@/hooks/useCardPayments'
import ActiveSessionsTable from '@/pages/operator/OperatorDashboard/ActiveSessionsTable'
import type { ParkingSession } from '@/types/parking'

interface SocketCallbacks {
  onCardPaymentStarted?: (payload: {
    orgId?: number
    sessionId: number
    candidateId: number | null
    operationNumber: string
    plateNumber: string
  }) => void
  onExitPaymentDeclined?: (payload: {
    orgId: number
    sessionId: number | null
    operationNumber: string
    reason: 'declined' | 'timeout'
    errorMessage: string | null
  }) => void
  onExitCompleted?: (payload: {
    orgId: number
    sessionId: number
    plateNumber: string
    amount: number
    paymentMethod: 'cash' | 'online' | 'card' | null
    barrierStatus: 'opened' | 'failed' | 'disabled' | 'not_configured'
  }) => void
}

const { getCardTerminalSettingsMock, socketCallbacksRef } = vi.hoisted(() => ({
  getCardTerminalSettingsMock: vi.fn(),
  socketCallbacksRef: { current: null as SocketCallbacks | null },
}))

vi.mock('@/api/organizations', () => ({
  getCardTerminalSettings: getCardTerminalSettingsMock,
}))

vi.mock('@/hooks/useParkingSocket', () => ({
  useParkingSocket: (callbacks: SocketCallbacks) => {
    socketCallbacksRef.current = callbacks
  },
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        user: { role: 'operator', org_id: 3 },
      },
    }),
}))

const session: ParkingSession = {
  id: 44,
  org_id: 3,
  plate_number: '01A777BA',
  entered_at: '2026-09-05T08:00:00.000Z',
  exited_at: null,
  duration_minutes: null,
  amount: null,
  status: 'active',
  entry_method: 'auto',
  exit_method: null,
  operator_id: null,
  created_at: '2026-09-05T08:00:00.000Z',
}

function StateProbe() {
  const { declinedPayments, isCardPending, isCardTerminalEnabled } =
    useCardPayments()
  return (
    <div>
      <span data-testid="terminal-enabled">
        {String(isCardTerminalEnabled)}
      </span>
      <span data-testid="pending-state">{String(isCardPending(44))}</span>
      <span data-testid="declined-state">
        {String(declinedPayments.has(44))}
      </span>
    </div>
  )
}

function renderProvider() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <CardPaymentProvider>
          <StateProbe />
          <ActiveSessionsTable
            dataSource={[session]}
            loading={false}
            now={new Date(session.entered_at).getTime()}
          />
        </CardPaymentProvider>
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('CardPaymentProvider', () => {
  beforeEach(() => {
    getCardTerminalSettingsMock.mockReset().mockResolvedValue({
      card_terminal_enabled: true,
      card_terminal_ip: '192.168.1.55',
      card_terminal_port: 62801,
      card_terminal_id: null,
      card_terminal_merchant_id: null,
    })
    socketCallbacksRef.current = null
  })

  it('started, declined va completed eventlarida holat, belgi va notificationlarni yangilaydi', async () => {
    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId('terminal-enabled')).toHaveTextContent('true'),
    )

    act(() => {
      socketCallbacksRef.current?.onCardPaymentStarted?.({
        orgId: 3,
        sessionId: 44,
        candidateId: 7,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      })
    })

    expect(screen.getByTestId('pending-state')).toHaveTextContent('true')
    expect(screen.getByTestId('card-payment-pending-44')).toBeInTheDocument()
    expect(await screen.findByText('Terminal tayyor')).toBeInTheDocument()

    act(() => {
      socketCallbacksRef.current?.onExitPaymentDeclined?.({
        orgId: 3,
        sessionId: 44,
        operationNumber: 'op-1',
        reason: 'declined',
        errorMessage: 'Terminal rad etdi',
      })
    })

    expect(screen.getByTestId('pending-state')).toHaveTextContent('false')
    expect(screen.getByTestId('declined-state')).toHaveTextContent('true')
    expect(
      screen.queryByTestId('card-payment-pending-44'),
    ).not.toBeInTheDocument()
    expect(
      await screen.findByText("Karta orqali to'lov amalga oshmadi"),
    ).toBeInTheDocument()

    act(() => {
      socketCallbacksRef.current?.onCardPaymentStarted?.({
        orgId: 3,
        sessionId: 44,
        candidateId: 7,
        operationNumber: 'op-2',
        plateNumber: '01A777BA',
      })
      socketCallbacksRef.current?.onExitCompleted?.({
        orgId: 3,
        sessionId: 44,
        plateNumber: '01A777BA',
        amount: 12000,
        paymentMethod: 'card',
        barrierStatus: 'opened',
      })
    })

    expect(screen.getByTestId('pending-state')).toHaveTextContent('false')
    expect(screen.getByTestId('declined-state')).toHaveTextContent('false')
    expect(
      await screen.findByText("To'lov karta orqali amalga oshirildi"),
    ).toBeInTheDocument()
  })

  it('terminal o‘chirilgan bo‘lsa pending belgini ko‘rsatmaydi', async () => {
    getCardTerminalSettingsMock.mockResolvedValue({
      card_terminal_enabled: false,
      card_terminal_ip: null,
      card_terminal_port: null,
      card_terminal_id: null,
      card_terminal_merchant_id: null,
    })
    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId('terminal-enabled')).toHaveTextContent('false'),
    )
    act(() => {
      socketCallbacksRef.current?.onCardPaymentStarted?.({
        orgId: 3,
        sessionId: 44,
        candidateId: null,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      })
    })

    expect(screen.getByTestId('pending-state')).toHaveTextContent('false')
    expect(
      screen.queryByTestId('card-payment-pending-44'),
    ).not.toBeInTheDocument()
  })
})
