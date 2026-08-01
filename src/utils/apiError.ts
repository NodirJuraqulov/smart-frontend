import { isAxiosError } from 'axios'

export function getErrorMessage(
  error: unknown,
  fallback: string,
  conflictFallback?: string,
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: unknown; error?: unknown }
      | undefined
    const message = data?.message ?? data?.error
    if (typeof message === 'string') return message
    if (error.response?.status === 409 && conflictFallback) {
      return conflictFallback
    }
  }
  return fallback
}
