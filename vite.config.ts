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
