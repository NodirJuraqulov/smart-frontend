import type { CSSProperties } from 'react'
import { palette } from './palette'
import type { ThemeMode } from './themeConfig'

export function getStatusTagStyle(
  isActive: boolean,
  mode: ThemeMode,
): CSSProperties {
  const { bg, text } = isActive
    ? palette.status.success[mode]
    : palette.status.error[mode]
  return { backgroundColor: bg, color: text, borderColor: 'transparent' }
}

export function getSessionStatusTagStyle(
  status: 'active' | 'completed',
  mode: ThemeMode,
): CSSProperties | undefined {
  if (status !== 'active') return undefined
  const { bg, text } = palette.status.success[mode]
  return { backgroundColor: bg, color: text, borderColor: 'transparent' }
}

export function getWarningTagStyle(mode: ThemeMode): CSSProperties {
  const { bg, text } = palette.status.warning[mode]
  return { backgroundColor: bg, color: text, borderColor: 'transparent' }
}
