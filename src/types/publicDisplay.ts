export interface HourlyTariffDisplay {
  price: number
  gracePeriodMinutes: number
}

export interface IntervalTariffDisplay {
  fromMinutes: number
  toMinutes: number | null
  price: number
}

export interface DisplayCapacity {
  occupied: number
  total: number | null
  available: number | null
}

export interface DisplayStatus {
  orgName: string
  pricingMode: 'hourly' | 'interval'
  capacity: DisplayCapacity
  hourlyTariff?: HourlyTariffDisplay
  intervalTariffs?: IntervalTariffDisplay[]
}

export type PublicDisplayState =
  | 'idle'
  | 'awaiting_operator'
  | 'completed'
  | 'barrier_failed'
  | 'declined'

export type PublicBarrierStatus =
  | 'opened'
  | 'failed'
  | 'disabled'
  | 'not_configured'

export interface EntryDisplayFlowStatus {
  state: PublicDisplayState
  plate: string | null
  barrier_status: PublicBarrierStatus | null
  updated_at: string
}

export interface ExitDisplayFlowStatus extends EntryDisplayFlowStatus {
  session_source: 'regular' | 'subscription' | 'vip' | null
  amount: number | null
  payment_method: 'cash' | 'online' | null
  duration_minutes: number | null
}

const displayStates: PublicDisplayState[] = [
  'idle',
  'awaiting_operator',
  'completed',
  'barrier_failed',
  'declined',
]

const barrierStatuses: PublicBarrierStatus[] = [
  'opened',
  'failed',
  'disabled',
  'not_configured',
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNullableString = (value: unknown) =>
  value === null || typeof value === 'string'

const isNullableNumber = (value: unknown) =>
  value === null || (typeof value === 'number' && Number.isFinite(value))

export function isEntryDisplayFlowStatus(
  value: unknown,
): value is EntryDisplayFlowStatus {
  if (!isRecord(value)) return false
  return (
    displayStates.includes(value.state as PublicDisplayState) &&
    isNullableString(value.plate) &&
    (value.barrier_status === null ||
      barrierStatuses.includes(value.barrier_status as PublicBarrierStatus)) &&
    typeof value.updated_at === 'string'
  )
}

export function isExitDisplayFlowStatus(
  value: unknown,
): value is ExitDisplayFlowStatus {
  if (!isRecord(value) || !isEntryDisplayFlowStatus(value)) return false
  const payload = value as EntryDisplayFlowStatus & Record<string, unknown>
  return (
    (payload.session_source === null ||
      payload.session_source === 'regular' ||
      payload.session_source === 'subscription' ||
      payload.session_source === 'vip') &&
    isNullableNumber(payload.amount) &&
    (payload.payment_method === null ||
      payload.payment_method === 'cash' ||
      payload.payment_method === 'online') &&
    isNullableNumber(payload.duration_minutes)
  )
}
