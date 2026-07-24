import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PermissionsCard from './PermissionsCard'
import type { OperatorPermissions } from '@/types/permissions'

const { getPermissionsMock, updatePermissionsMock } = vi.hoisted(() => ({
  getPermissionsMock: vi.fn(),
  updatePermissionsMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getPermissions: getPermissionsMock,
  updatePermissions: updatePermissionsMock,
}))

const permissions: OperatorPermissions = {
  can_view_dashboard: true,
  can_view_sessions: true,
  can_view_reports: false,
  can_view_tariffs: true,
  can_view_subscriptions: false,
  can_view_settings: true,
  can_view_activity_log: false,
}

function renderCard(queryClient = new QueryClient()) {
  render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <PermissionsCard orgId={1} />
        </AntdApp>
      </QueryClientProvider>
    </ThemeProvider>,
  )
  return queryClient
}

function openEdit() {
  fireEvent.click(screen.getByRole('button', { name: /Tahrirlash/ }))
}

describe('PermissionsCard', () => {
  beforeEach(() => {
    getPermissionsMock.mockReset()
    updatePermissionsMock.mockReset()
  })

  it("sahifa ochilganda KORISH rejimida server qiymatlari togri korsatiladi (regression)", async () => {
    getPermissionsMock.mockResolvedValue(permissions)
    renderCard()

    await waitFor(() =>
      expect(screen.getAllByText("Ko'rinadi").length).toBeGreaterThan(0),
    )
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()
    expect(screen.getAllByText("Ko'rinadi")).toHaveLength(4)
    expect(screen.getAllByText('Yashirilgan')).toHaveLength(3)
  })

  it("Tahrirlash bosilganda forma hozirgi qiymatlar bilan ochiladi (regression)", async () => {
    getPermissionsMock.mockResolvedValue(permissions)
    renderCard()

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Tahrirlash/ }),
      ).toBeInTheDocument(),
    )
    openEdit()

    expect(screen.getByRole('checkbox', { name: 'Dashboard' })).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Hisobotlar' }),
    ).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Saqlash' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bekor qilish' }),
    ).toBeInTheDocument()
  })

  it("checkbox ozgartirilib Saqlash bosilganda to'liq obyekt yuboriladi va KORISH rejimiga qaytadi (regression)", async () => {
    getPermissionsMock.mockResolvedValue(permissions)
    updatePermissionsMock.mockResolvedValue({
      ...permissions,
      can_view_reports: true,
    })
    renderCard()

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Tahrirlash/ }),
      ).toBeInTheDocument(),
    )
    openEdit()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hisobotlar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updatePermissionsMock).toHaveBeenCalled())
    expect(updatePermissionsMock.mock.calls[0][0]).toEqual({
      id: 1,
      permissions: { ...permissions, can_view_reports: true },
    })

    await waitFor(() =>
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()
  })

  it("Bekor qilish bosilganda ozgarishlar tashlanib KORISH rejimiga qaytadi (regression)", async () => {
    getPermissionsMock.mockResolvedValue(permissions)
    renderCard()

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Tahrirlash/ }),
      ).toBeInTheDocument(),
    )
    openEdit()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hisobotlar' }))
    expect(screen.getByRole('checkbox', { name: 'Hisobotlar' })).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(updatePermissionsMock).not.toHaveBeenCalled()
    expect(screen.getAllByText('Yashirilgan')).toHaveLength(3)
  })

  it("fon qayta-render'da (data reference o'zgarganda) tahrirlash paytida belgilangan checkboxlar saqlanib qoladi (regression)", async () => {
    getPermissionsMock.mockResolvedValue(permissions)
    const queryClient = new QueryClient({
      defaultOptions: { queries: { structuralSharing: false } },
    })
    renderCard(queryClient)

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Tahrirlash/ }),
      ).toBeInTheDocument(),
    )
    openEdit()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hisobotlar' }))
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Hisobotlar' })).toBeChecked(),
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Obunalar' }))
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Obunalar' })).toBeChecked(),
    )

    await act(async () => {
      queryClient.setQueryData(['permissions', 1], { ...permissions })
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(screen.getByRole('checkbox', { name: 'Dashboard' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Hisobotlar' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Obunalar' })).toBeChecked()
  })
})
