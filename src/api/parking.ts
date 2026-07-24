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

function buildManualRequest(
  plateNumber: string,
  image?: File,
  extra?: Record<string, string>,
) {
  if (!image) {
    return { data: { plate_number: plateNumber, ...extra }, headers: undefined }
  }
  const formData = new FormData()
  formData.append('plate_number', plateNumber)
  formData.append('image', image)
  for (const [key, value] of Object.entries(extra ?? {})) {
    formData.append(key, value)
  }
  return { data: formData, headers: { 'Content-Type': undefined } }
}

export const entryManual = (plateNumber: string, image?: File) => {
  const { data, headers } = buildManualRequest(plateNumber, image)
  return axiosInstance
    .post<{ session: ParkingSession }>('/api/parking/entry/manual', data, {
      headers,
    })
    .then((res) => res.data.session)
}

export const exitManual = (
  plateNumber: string,
  paymentMethod: PaymentMethod,
  image?: File,
) => {
  const { data, headers } = buildManualRequest(plateNumber, image, {
    payment_method: paymentMethod,
  })
  return axiosInstance
    .post<{ session: ParkingSession; payment: Payment }>(
      '/api/parking/exit/manual',
      data,
      { headers },
    )
    .then((res) => res.data)
}

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
