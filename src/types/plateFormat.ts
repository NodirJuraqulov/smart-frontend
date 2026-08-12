export interface PlateFormat {
  id: number
  org_id: number
  pattern: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface CreatePlateFormatPayload {
  pattern: string
  description?: string | null
}

export interface UpdatePlateFormatPayload {
  pattern?: string
  description?: string | null
  is_active?: boolean
}

export interface PlateFormatValidationSetting {
  enabled: boolean
}
