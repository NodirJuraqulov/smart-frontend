import { axiosInstance } from './axiosInstance'
import type {
  CreatePlateFormatPayload,
  PlateFormat,
  PlateFormatValidationSetting,
  UpdatePlateFormatPayload,
} from '@/types/plateFormat'

const basePath = (orgId: number) => `/api/organizations/${orgId}/plate-formats`

export const getPlateFormats = (orgId: number) =>
  axiosInstance
    .get<{ formats: PlateFormat[] }>(basePath(orgId))
    .then((res) => res.data.formats)

export const createPlateFormat = ({
  orgId,
  ...payload
}: CreatePlateFormatPayload & { orgId: number }) =>
  axiosInstance
    .post<{ format: PlateFormat }>(basePath(orgId), payload)
    .then((res) => res.data.format)

export const updatePlateFormat = ({
  orgId,
  formatId,
  ...payload
}: UpdatePlateFormatPayload & { orgId: number; formatId: number }) =>
  axiosInstance
    .patch<{ format: PlateFormat }>(`${basePath(orgId)}/${formatId}`, payload)
    .then((res) => res.data.format)

export const deletePlateFormat = ({
  orgId,
  formatId,
}: {
  orgId: number
  formatId: number
}) =>
  axiosInstance
    .delete<void>(`${basePath(orgId)}/${formatId}`)
    .then(() => undefined)

export const getPlateFormatValidationSetting = (orgId: number) =>
  axiosInstance
    .get<PlateFormatValidationSetting>(
      `/api/organizations/${orgId}/plate-format-validation-setting`,
    )
    .then((res) => res.data)

export const updatePlateFormatValidationSetting = ({
  orgId,
  enabled,
}: {
  orgId: number
  enabled: boolean
}) =>
  axiosInstance
    .patch<PlateFormatValidationSetting>(
      `/api/organizations/${orgId}/plate-format-validation-setting`,
      { enabled },
    )
    .then((res) => res.data)
