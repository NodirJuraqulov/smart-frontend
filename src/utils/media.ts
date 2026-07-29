import { joinRuntimeUrl } from './runtimeBaseUrl'

export function buildMediaUrl(path: string): string {
  return joinRuntimeUrl(path)
}
