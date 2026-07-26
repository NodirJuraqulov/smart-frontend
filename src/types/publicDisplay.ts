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
}

export interface DisplayStatus {
  orgName: string
  pricingMode: 'hourly' | 'interval'
  capacity: DisplayCapacity
  hourlyTariff?: HourlyTariffDisplay
  intervalTariffs?: IntervalTariffDisplay[]
}
