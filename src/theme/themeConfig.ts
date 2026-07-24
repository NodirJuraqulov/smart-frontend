import { theme as antdTheme, type ThemeConfig } from 'antd'
import {
  colorBorder,
  colorPageBg,
  colorSidebarActive,
  colorSurface,
  palette,
} from './palette'

export type ThemeMode = 'light' | 'dark'

export const HEADER_HEIGHT = 64

export function buildThemeConfig(mode: ThemeMode): ThemeConfig {
  const surface = colorSurface[mode]
  const pageBg = colorPageBg[mode]
  const border = colorBorder[mode]
  const sidebarActive = colorSidebarActive[mode]
  const boxShadow = mode === 'dark' ? palette.shadow.dark : palette.shadow.light

  return {
    algorithm:
      mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: palette.primary,
      colorSuccess: palette.success,
      colorWarning: palette.warning,
      colorError: palette.error,
      colorInfo: palette.info,
      colorBgLayout: pageBg,
      colorBgContainer: surface,
      colorBgElevated: surface,
      colorBorder: border,
      colorBorderSecondary: border,
      boxShadowTertiary: boxShadow,
    },
    components: {
      Button: {
        controlHeight: 44,
        controlHeightLG: 48,
        controlHeightSM: 40,
      },
      Menu: {
        itemSelectedBg: sidebarActive,
        darkItemSelectedBg: sidebarActive,
        itemHoverBg: sidebarActive,
        darkItemHoverBg: sidebarActive,
        itemBg: 'transparent',
        subMenuItemBg: 'transparent',
        darkItemBg: 'transparent',
        darkSubMenuItemBg: 'transparent',
      },
      Layout: {
        headerBg: surface,
        headerHeight: HEADER_HEIGHT,
        siderBg: surface,
        lightSiderBg: surface,
        bodyBg: pageBg,
      },
    },
  }
}
