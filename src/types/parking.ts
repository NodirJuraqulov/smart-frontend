export type SessionStatus = 'active' | 'completed'
export type EntryExitMethod = 'auto' | 'manual'
export type ExitMethod = EntryExitMethod | 'forced'

export interface ParkingSession {
  id: number
  org_id: number
  plate_number: string
  entered_at: string
  exited_at: string | null
  duration_minutes: number | null
  amount: number | null
  status: SessionStatus
  entry_method: EntryExitMethod
  exit_method: ExitMethod | null
  image_entry?: string | null
  image_exit?: string | null
  entryOverviewImageUrl?: string | null
  exitOverviewImageUrl?: string | null
  entryVehicleImageUrl?: string | null
  entryPlateImageUrl?: string | null
  exitVehicleImageUrl?: string | null
  exitPlateImageUrl?: string | null
  operator_id: number | null
  created_at: string
}

export interface SessionsQueryParams {
  page?: number
  limit?: number
  status?: SessionStatus
  plate_number?: string
  date?: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface SessionsResponse {
  sessions: ParkingSession[]
  pagination: PaginationMeta
}

export interface AwaitingPaymentSession extends Omit<ParkingSession, 'status'> {
  status: 'awaiting_payment'
  is_overdue: boolean
}

export type PaymentMethod = 'cash' | 'online'

export interface Payment {
  id: number
  org_id: number
  session_id: number
  amount: number
  payment_method: PaymentMethod
  paid_at: string
}

export interface ParkingCapacity {
  occupied: number
  total: number | null
  available: number | null
}

export type DetectionType = 'entry' | 'exit'
