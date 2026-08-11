export function emergencyBarrierSettingsQueryKey(orgId: number) {
  return ['organizations', orgId, 'emergency-barrier-settings'] as const
}
