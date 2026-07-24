export const colorSurface = {
  light: '#eeeef1',
  dark: '#0a1929',
}

export const colorPageBg = {
  light: '#f5f5f7',
  dark: '#041324',
}

export const colorBrandAuto = {
  light: '#1d4ed8',
  dark: '#3b82f6',
}

export const colorBrandStoyanka = {
  light: '#0f172a',
  dark: '#f1f5f9',
}

export const colorBorder = {
  light: '#d9d9d9',
  dark: '#2A4562',
}

export const colorSidebarActive = {
  light: '#dcdce1',
  dark: '#061423',
}

export const palette = {
  primary: '#1d4ed8',
  primaryHover: '#1e40af',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  sidebarText: '#ffffff',
  shadow: {
    light: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    dark: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
  },
  status: {
    success: {
      light: { bg: '#dcfce7', text: '#15803d' },
      dark: { bg: '#14532d', text: '#4ade80' },
    },
    error: {
      light: { bg: '#fee2e2', text: '#b91c1c' },
      dark: { bg: '#7f1d1d', text: '#f87171' },
    },
    warning: {
      light: { bg: '#fef3c7', text: '#b45309' },
      dark: { bg: '#78350f', text: '#fbbf24' },
    },
  },
} as const

export type PaletteKey = keyof typeof palette
