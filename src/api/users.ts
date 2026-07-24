import { axiosInstance } from './axiosInstance'
import { mapOperator, type OperatorDto } from './mappers'
import type { CreateOperatorPayload, UpdateOperatorPayload } from '@/types/user'

export const getOperators = () =>
  axiosInstance
    .get<{ operators: OperatorDto[] }>('/api/admin/users')
    .then((res) => res.data.operators.map(mapOperator))

export const createOperator = (payload: CreateOperatorPayload) =>
  axiosInstance
    .post<{ operator: OperatorDto }>('/api/admin/users', payload)
    .then((res) => mapOperator(res.data.operator))

export const updateOperator = ({
  id,
  ...payload
}: UpdateOperatorPayload & { id: number }) =>
  axiosInstance
    .put<{ operator: OperatorDto }>(`/api/admin/users/${id}`, payload)
    .then((res) => mapOperator(res.data.operator))

export const resetPassword = ({
  id,
  password,
}: {
  id: number
  password: string
}) =>
  axiosInstance
    .put<{ operator: OperatorDto }>(`/api/admin/users/${id}`, { password })
    .then((res) => mapOperator(res.data.operator))

export const toggleBlock = ({
  id,
  is_active,
}: {
  id: number
  is_active: boolean
}) =>
  axiosInstance
    .patch<{ operator: OperatorDto }>(`/api/admin/users/${id}/block`, {
      is_active,
    })
    .then((res) => mapOperator(res.data.operator))
