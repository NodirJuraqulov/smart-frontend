import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import authReducer from '@/store/authSlice'
import AppRoutes from '@/routes/AppRoutes'

const { postMock, getMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  getMock: vi.fn(),
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    post: postMock,
    get: getMock,
  },
}))

function renderApp() {
  const store = configureStore({ reducer: { auth: authReducer } })
  const queryClient = new QueryClient()

  render(
    <Provider store={store}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AntdApp>
            <MemoryRouter initialEntries={['/login']}>
              <AppRoutes />
            </MemoryRouter>
          </AntdApp>
        </QueryClientProvider>
      </ThemeProvider>
    </Provider>,
  )
}

function submitLoginForm() {
  fireEvent.change(screen.getByPlaceholderText('Login'), {
    target: { value: 'aziz1' },
  })
  fireEvent.change(screen.getByPlaceholderText('Parol'), {
    target: { value: 'secret1' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Kirish' }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    postMock.mockReset()
    getMock.mockReset()
  })

  it("owner uchun /api/auth/login javobida 'permissions' UMUMAN BOLMASA HAM xatosiz Dashboard'ga otadi (regression)", async () => {
    postMock.mockResolvedValue({
      data: {
        token: 'owner-access-token',
        refreshToken: 'owner-refresh-token',
        user: {
          id: 'u2',
          name: 'Aziz Egamov',
          role: 'owner',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
      },
    })
    getMock.mockResolvedValue({
      data: {
        user: {
          id: 'u2',
          name: 'Aziz Egamov',
          role: 'owner',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
      },
    })
    renderApp()

    submitLoginForm()

    await waitFor(() => expect(screen.getByText('Tariflar')).toBeInTheDocument())
    expect(
      screen.queryByText("Server bilan bog'lanishda xatolik yuz berdi"),
    ).not.toBeInTheDocument()
  })

  it("operator LOGIN qilganda ruxsatsiz bolimlar HECH QACHON (vaqtincha ham) sidebarda korinmaydi, faqat togri royxat korsatiladi (regression)", async () => {
    postMock.mockResolvedValue({
      data: {
        token: 'operator-access-token',
        refreshToken: 'operator-refresh-token',
        user: {
          id: 'u1',
          name: 'Bekzod',
          role: 'operator',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
      },
    })
    getMock.mockResolvedValue({
      data: {
        user: {
          id: 'u1',
          name: 'Bekzod',
          role: 'operator',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
        permissions: {
          dashboard: true,
          sessions: true,
          reports: true,
          tariffs: false,
          subscriptions: false,
          settings: false,
          activity_log: false,
        },
      },
    })
    renderApp()

    submitLoginForm()

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    expect(screen.getByText('Sessiyalar')).toBeInTheDocument()
    expect(screen.getByText('Hisobotlar')).toBeInTheDocument()
    expect(screen.queryByText('Tariflar')).not.toBeInTheDocument()
    expect(screen.queryByText('Obunalar')).not.toBeInTheDocument()
    expect(screen.queryByText('Sozlamalar')).not.toBeInTheDocument()
  })

  it("login POST dan keyin /auth/me GET chaqirilib, natija kelgunча navigate qilinmaydi (regression)", async () => {
    let resolveMe: (value: unknown) => void = () => {}
    postMock.mockResolvedValue({
      data: {
        token: 'operator-access-token',
        refreshToken: 'operator-refresh-token',
        user: {
          id: 'u1',
          name: 'Bekzod',
          role: 'operator',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
      },
    })
    getMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMe = resolve
      }),
    )
    renderApp()

    submitLoginForm()

    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/api/auth/me'))
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(postMock).toHaveBeenCalledTimes(1)

    resolveMe({
      data: {
        user: {
          id: 'u1',
          name: 'Bekzod',
          role: 'operator',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
        permissions: {
          dashboard: true,
          sessions: true,
          reports: true,
          tariffs: true,
          subscriptions: true,
          settings: true,
          activity_log: true,
        },
      },
    })

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
  })
})
