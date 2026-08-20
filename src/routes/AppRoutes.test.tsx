import { describe, expect, it, vi } from 'vitest'
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

vi.mock('@/layouts/components/BlacklistAttemptNotifier', () => ({
  default: () => null,
}))

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

const ownerUser: AuthUser = {
  ...operatorUser,
  id: 'owner-1',
  name: 'Sardor',
  role: 'owner',
}

function renderAtPath(path: string, user: AuthUser = operatorUser) {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: {
        user,
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

  it("Qora ro'yxat Owner sidebarida ko'rinadi", async () => {
    renderAtPath('/operator/sessions', ownerUser)

    expect(await screen.findByText("Qora ro'yxat")).toBeInTheDocument()
  })

  it("Qora ro'yxat subscriptions ruxsatli operatorda ham ko'rinmaydi", async () => {
    renderAtPath('/operator/sessions', {
      ...operatorUser,
      permissions: {
        ...operatorUser.permissions,
        can_view_subscriptions: true,
      },
    })

    expect(await screen.findByText('VIP mashinalar')).toBeInTheDocument()
    expect(screen.queryByText("Qora ro'yxat")).not.toBeInTheDocument()
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

describe('AppRoutes header label', () => {
  it('sarlavhada rol emas, foydalanuvchi ismi koʻrsatiladi', async () => {
    renderAtPath('/operator/sessions')

    expect(await screen.findByText('Chorsu (Bekzod)')).toBeInTheDocument()
    expect(screen.queryByText('Chorsu (Operator)')).not.toBeInTheDocument()
  })

  it('kassir uchun ham ism koʻrsatiladi', async () => {
    renderAtPath('/operator/reports', {
      ...operatorUser,
      role: 'kassir',
      name: 'Alisher Karimov',
    })

    expect(
      await screen.findByText('Chorsu (Alisher Karimov)'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Chorsu (Kassir)')).not.toBeInTheDocument()
  })

  it('ism boʻsh boʻlsa rol nomiga qaytadi', async () => {
    renderAtPath('/operator/sessions', { ...operatorUser, name: '   ' })

    expect(await screen.findByText('Chorsu (Operator)')).toBeInTheDocument()
  })
})
