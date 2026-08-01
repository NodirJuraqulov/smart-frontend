import { axiosInstance } from './axiosInstance'
import type {
  ParkingCapacity,
  ParkingSession,
  Payment,
  PaymentMethod,
  SessionsQueryParams,
  SessionsResponse,
} from '@/types/parking'

export const getSessions = (params: SessionsQueryParams) =>
  axiosInstance
    .get<SessionsResponse>('/api/parking/sessions', { params })
    .then((res) => res.data)

export const getActiveSessions = () =>
  axiosInstance
    .get<{ sessions: ParkingSession[] }>('/api/parking/active')
    .then((res) => res.data.sessions)

export const getCapacity = () =>
  axiosInstance
    .get<ParkingCapacity>('/api/parking/capacity')
    .then((res) => res.data)

export const entryManual = (plateNumber: string) =>
  axiosInstance
    .post<{ session: ParkingSession }>('/api/parking/entry/manual', {
      plate_number: plateNumber,
    })
    .then((res) => res.data.session)

export const exitManual = (plateNumber: string, paymentMethod: PaymentMethod) =>
  axiosInstance
    .post<{ session: ParkingSession; payment: Payment }>(
      '/api/parking/exit/manual',
      { plate_number: plateNumber, payment_method: paymentMethod },
    )
    .then((res) => res.data)

export interface ForceCloseSessionPayload {
  exited_at?: string
  amount?: number
  payment_method: PaymentMethod
}

export const forceCloseSession = (
  id: number,
  payload: ForceCloseSessionPayload,
) =>
  axiosInstance
    .post<{ session: ParkingSession; payment: Payment }>(
      `/api/parking/sessions/${id}/force-close`,
      payload,
    )
    .then((res) => res.data)

export const updateSessionPaymentMethod = ({
  id,
  payment_method,
}: {
  id: number
  payment_method: PaymentMethod
}) =>
  axiosInstance
    .post<{ session: ParkingSession; payment: Payment }>(
      `/api/parking/sessions/${id}/payment-method`,
      { payment_method },
    )
    .then((res) => res.data)

export const openBarrierForSession = ({
  id,
  direction,
}: {
  id: number
  direction: 'entry' | 'exit'
}) =>
  axiosInstance
    .post<{ success: boolean }>(`/api/parking/sessions/${id}/open-barrier`, {
      direction,
    })
    .then((res) => res.data.success)

export const printReceiptForSession = (id: number) =>
  axiosInstance
    .post<{ success: boolean; reason?: string }>(
      `/api/parking/sessions/${id}/print-receipt`,
    )
    .then((res) => res.data)
