import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiOrigin = env.VITE_API_URL || 'http://localhost:5000'
  const wsOrigin = apiOrigin.replace(/^http/, 'ws')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (
              id.includes('/react-dom/') ||
              id.includes('/react/') ||
              id.includes('/scheduler/')
            ) {
              return 'vendor-react'
            }
            if (id.includes('react-router')) return 'vendor-router'
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux'
            }
            if (id.includes('@tanstack')) return 'vendor-query'
            if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
              return 'vendor-socket'
            }
            if (id.includes('i18next')) return 'vendor-i18n'
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts'
            }
            if (id.includes('/antd/es/table') || id.includes('@rc-component/table')) {
              return 'vendor-antd-table'
            }
            if (
              id.includes('/antd/es/date-picker') ||
              id.includes('/antd/es/time-picker') ||
              id.includes('/antd/es/calendar') ||
              id.includes('@rc-component/picker')
            ) {
              return 'vendor-antd-picker'
            }
            if (
              id.includes('/antd/es/select') ||
              id.includes('/antd/es/tree') ||
              id.includes('@rc-component/select') ||
              id.includes('@rc-component/tree')
            ) {
              return 'vendor-antd-select'
            }
            if (id.includes('@rc-component/tabs') || id.includes('/antd/es/tabs')) {
              return 'vendor-antd-tabs'
            }
            if (id.includes('@ant-design/icons')) return 'vendor-antd-icons'
            if (
              id.includes('@rc-component/form') ||
              id.includes('@rc-component/async-validator') ||
              id.includes('/antd/es/form')
            ) {
              return 'vendor-antd-form'
            }
            if (
              id.includes('@rc-component/menu') ||
              id.includes('@rc-component/dropdown') ||
              id.includes('@rc-component/trigger') ||
              id.includes('/antd/es/menu') ||
              id.includes('/antd/es/dropdown')
            ) {
              return 'vendor-antd-menu'
            }
            if (
              id.includes('/antd/es/modal') ||
              id.includes('/antd/es/notification') ||
              id.includes('/antd/es/message') ||
              id.includes('/antd/es/result') ||
              id.includes('/antd/es/popconfirm') ||
              id.includes('/antd/es/popover') ||
              id.includes('@rc-component/dialog') ||
              id.includes('@rc-component/notification')
            ) {
              return 'vendor-antd-feedback'
            }
            if (
              id.includes('/antd/es/button') ||
              id.includes('/antd/es/typography') ||
              id.includes('/antd/es/radio') ||
              id.includes('/antd/es/checkbox') ||
              id.includes('/antd/es/space') ||
              id.includes('/antd/es/tag') ||
              id.includes('/antd/es/spin') ||
              id.includes('/antd/es/divider') ||
              id.includes('/antd/es/skeleton') ||
              id.includes('@rc-component/checkbox')
            ) {
              return 'vendor-antd-basic'
            }
            if (
              id.includes('/antd/es/config-provider') ||
              id.includes('/antd/es/theme') ||
              id.includes('/antd/es/style') ||
              id.includes('@ant-design/cssinjs')
            ) {
              return 'vendor-antd-theme'
            }
            if (
              id.includes('/antd/es/input') ||
              id.includes('/antd/es/descriptions') ||
              id.includes('/antd/es/card') ||
              id.includes('/antd/es/image') ||
              id.includes('/antd/es/tooltip') ||
              id.includes('/antd/es/layout') ||
              id.includes('/antd/es/pagination') ||
              id.includes('@rc-component/virtual-list') ||
              id.includes('@rc-component/input-number') ||
              id.includes('@rc-component/image')
            ) {
              return 'vendor-antd-data'
            }
            if (
              id.includes('/antd/') ||
              id.includes('@ant-design') ||
              id.includes('@rc-component') ||
              id.includes('/rc-')
            ) {
              return 'vendor-antd'
            }
            if (id.includes('axios') || id.includes('dayjs')) {
              return 'vendor-utils'
            }
            return 'vendor-misc'
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      headers: {
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' data: blob: ${apiOrigin}`,
          `connect-src 'self' ${apiOrigin} ${wsOrigin}`,
          "object-src 'none'",
          "frame-ancestors 'self'",
        ].join('; '),
      },
    },
  }
})
