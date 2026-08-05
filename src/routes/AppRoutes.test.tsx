import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import authReducer from '@/store/authSlice'
import AppRoutes from './AppRoutes'
import type { AuthUser } from '@/types/auth'

const operatorUser: AuthUser = {
  id: 'u1',
  org_id: 1,
  name: 'Bekzod',
  role: 'operator',
  org_name: 'Chorsu',
  pricing_mode: 'hourly',
  permissions: {
    can_view_dashboard: true,
    can_view_sessions: true,
    can_view_reports: true,
    can_view_tariffs: false,
    can_view_subscriptions: false,
    can_view_settings: false,
    can_view_activity_log: false,
  },
}

function renderAtPath(path: string) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user: operatorUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    },
  })
  const queryClient = new QueryClient()

  render(
    <Provider store={store}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AntdApp>
            <MemoryRouter initialEntries={[path]}>
              <AppRoutes />
            </MemoryRouter>
          </AntdApp>
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>,
  )
}

describe('AppRoutes sidebar permission filtering', () => {
  it("HAQIQIY /auth/me formatidan mapped permissions bilan FAQAT ruxsat berilgan bolimlarni korsatadi (regression)", async () => {
    renderAtPath('/operator/sessions')

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Sessiyalar')).toBeInTheDocument()
    expect(screen.getByText('Hisobotlar')).toBeInTheDocument()
    expect(screen.queryByText('Tariflar')).not.toBeInTheDocument()
    expect(screen.queryByText('Obunalar')).not.toBeInTheDocument()
    expect(screen.queryByText('Sozlamalar')).not.toBeInTheDocument()
  })

  it("VIP mashinalar Obunalar bilan bir xil ruxsatga bogliq, Klinika chegirmasi esa ruxsatsiz har doim korinadi (regression)", async () => {
    renderAtPath('/operator/sessions')

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('VIP mashinalar')).not.toBeInTheDocument()
    expect(screen.getByText('Klinika chegirmasi')).toBeInTheDocument()
  })

  it("ruxsat false bolgan yolga kirishga urinilganda PermissionRoute /403 ga yonaltiradi (regression)", async () => {
    renderAtPath('/operator/tariffs')

    expect(await screen.findByText("Ruxsat yo'q")).toBeInTheDocument()
  })

  it('operator Super Admin organization route orqali lane controlsga kira olmaydi', async () => {
    renderAtPath('/admin/organizations/1')

    expect(await screen.findByText('Sessiyalar')).toBeInTheDocument()
    expect(
      screen.queryByText('Yo‘lak va kamera himoyasi'),
    ).not.toBeInTheDocument()
  })
})
