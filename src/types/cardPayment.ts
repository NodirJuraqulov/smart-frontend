export interface CardPaymentStartedEvent {
  orgId?: number
  sessionId: number
  candidateId: number | null
  operationNumber: string
  plateNumber: string
}

export interface ExitPaymentDeclinedEvent {
  orgId: number
  sessionId: number | null
  operationNumber: string
  reason: 'declined' | 'timeout'
  errorMessage: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export function isCardPaymentStartedEvent(
  value: unknown,
): value is CardPaymentStartedEvent {
  if (!isRecord(value)) return false
  return (
    (value.orgId === undefined || typeof value.orgId === 'number') &&
    typeof value.sessionId === 'number' &&
    (value.candidateId === null || typeof value.candidateId === 'number') &&
    typeof value.operationNumber === 'string' &&
    typeof value.plateNumber === 'string'
  )
}

export function isExitPaymentDeclinedEvent(
  value: unknown,
): value is ExitPaymentDeclinedEvent {
  if (!isRecord(value)) return false
  return (
    typeof value.orgId === 'number' &&
    (value.sessionId === null || typeof value.sessionId === 'number') &&
    typeof value.operationNumber === 'string' &&
    (value.reason === 'declined' || value.reason === 'timeout') &&
    (value.errorMessage === null || typeof value.errorMessage === 'string')
  )
}
