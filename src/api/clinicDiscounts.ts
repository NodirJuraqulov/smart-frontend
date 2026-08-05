import { axiosInstance } from './axiosInstance'
import type {
  ClinicDiscount,
  ClinicDiscountSettings,
  ClinicDiscountsQueryParams,
  ClinicDiscountsResponse,
} from '@/types/clinicDiscount'

export const getClinicDiscounts = (
  orgId: number,
  params: ClinicDiscountsQueryParams,
) =>
  axiosInstance
    .get<ClinicDiscountsResponse>(
      `/api/organizations/${orgId}/clinic-discounts`,
      { params },
    )
    .then((res) => res.data)

export const cancelClinicDiscount = ({
  orgId,
  discountId,
}: {
  orgId: number
  discountId: number
}) =>
  axiosInstance
    .post<{ discount: ClinicDiscount }>(
      `/api/organizations/${orgId}/clinic-discounts/${discountId}/cancel`,
    )
    .then((res) => res.data.discount)

export const getClinicDiscountSettings = (orgId: number) =>
  axiosInstance
    .get<ClinicDiscountSettings>(
      `/api/organizations/${orgId}/clinic-discount-settings`,
    )
    .then((res) => res.data)

export const updateClinicDiscountSettings = ({
  orgId,
  ...payload
}: ClinicDiscountSettings & { orgId: number }) =>
  axiosInstance
    .patch<ClinicDiscountSettings>(
      `/api/organizations/${orgId}/clinic-discount-settings`,
      payload,
    )
    .then((res) => res.data)
