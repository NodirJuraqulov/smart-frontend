export function resolveRuntimeBaseUrl(
  configuredUrl: string | undefined,
  browserOrigin: string = window.location.origin,
): string {
  const configured = configuredUrl?.trim()
  const resolved =
    !configured || configured === 'same-origin' ? browserOrigin : configured

  return resolved.replace(/\/+$/, '')
}

export const API_BASE_URL = resolveRuntimeBaseUrl(import.meta.env.VITE_API_URL)

export function joinRuntimeUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path.replace(/\/+$/, '')
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`
}
