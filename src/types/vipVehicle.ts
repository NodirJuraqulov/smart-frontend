export interface VipVehicle {
  id: number
  org_id: number
  plate_number: string
  note: string | null
  created_at: string
}

export interface CreateVipVehiclePayload {
  plate_number: string
  note?: string
}

export interface UpdateVipVehiclePayload {
  plate_number?: string
  note?: string
}
