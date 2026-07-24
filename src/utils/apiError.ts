import { isAxiosError } from 'axios'

export function getErrorMessage(
  error: unknown,
  fallback: string,
  conflictFallback?: string,
): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === 'string') return message
    if (error.response?.status === 409 && conflictFallback) {
      return conflictFallback
    }
  }
  return fallback
}
