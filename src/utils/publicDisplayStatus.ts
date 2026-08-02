import type { PublicDisplayState } from '@/types/publicDisplay'

export const PUBLIC_DISPLAY_TRANSIENT_MS = 15_000

export function isTransientPublicDisplayState(state: PublicDisplayState) {
  return state === 'completed' || state === 'declined'
}

export function getPublicDisplayRemainingMs(
  updatedAt: string,
  now = Date.now(),
) {
  const updatedAtMs = Date.parse(updatedAt)
  if (!Number.isFinite(updatedAtMs)) return 0
  const elapsed = Math.max(0, now - updatedAtMs)
  return Math.max(0, PUBLIC_DISPLAY_TRANSIENT_MS - elapsed)
}
