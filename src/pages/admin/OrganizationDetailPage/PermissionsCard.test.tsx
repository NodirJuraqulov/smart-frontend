import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PermissionsCard from './PermissionsCard'
import type { OperatorPermissions, PermissionRole } from '@/types/permissions'

const { getPermissionsMock, updatePermissionsMock } = vi.hoisted(() => ({
  getPermissionsMock: vi.fn(),
  updatePermissionsMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getPermissions: getPermissionsMock,
  updatePermissions: updatePermissionsMock,
}))

const operatorPermissions: OperatorPermissions = {
  can_view_dashboard: true,
  can_view_sessions: true,
  can_view_reports: true,
  can_view_tariffs: true,
  can_view_subscriptions: true,
  can_view_settings: true,
  can_view_activity_log: true,
}

const kassirPermissions: OperatorPermissions = {
  can_view_dashboard: false,
  can_view_sessions: false,
  can_view_reports: true,
  can_view_tariffs: false,
  can_view_subscriptions: false,
  can_view_settings: false,
  can_view_activity_log: false,
}

function renderCard() {
  render(
    <ThemeProvider>
      <QueryClientProvider client={new QueryClient()}>
        <AntdApp>
          <PermissionsCard orgId={1} />
        </AntdApp>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

function card(role: PermissionRole) {
  return within(screen.getByTestId(`permissions-card-${role}`))
}

async function waitForBothCards() {
  await waitFor(() => {
    expect(
      card('operator').getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()
    expect(
      card('kassir').getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()
  })
}

describe('PermissionsCard', () => {
  beforeEach(() => {
    getPermissionsMock.mockReset().mockImplementation(
      (_id: number, role: PermissionRole) =>
        Promise.resolve(
          role === 'kassir' ? kassirPermissions : operatorPermissions,
        ),
    )
    updatePermissionsMock.mockReset()
  })

  it('ikkala ustun mos role parametri bilan yuklanadi', async () => {
    renderCard()

    await waitFor(() => expect(getPermissionsMock).toHaveBeenCalledTimes(2))
    expect(getPermissionsMock).toHaveBeenCalledWith(1, 'operator')
    expect(getPermissionsMock).toHaveBeenCalledWith(1, 'kassir')

    expect(screen.getByText('Operator ruxsatlari')).toBeInTheDocument()
    expect(screen.getByText('Kassir ruxsatlari')).toBeInTheDocument()

    await waitFor(() =>
      expect(card('operator').getAllByText("Ko'rinadi")).toHaveLength(7),
    )
    expect(card('kassir').getAllByText("Ko'rinadi")).toHaveLength(1)
    expect(card('kassir').getAllByText('Yashirilgan')).toHaveLength(6)
  })

  it('har bir ustunning oʻz Tahrirlash tugmasi bor', async () => {
    renderCard()

    await waitForBothCards()
  })

  it('operator ustuni tahrirlanganda faqat role=operator bilan yuboriladi', async () => {
    updatePermissionsMock.mockResolvedValue({
      ...operatorPermissions,
      can_view_reports: false,
    })
    renderCard()
    await waitForBothCards()

    fireEvent.click(card('operator').getByRole('button', { name: /Tahrirlash/ }))
    fireEvent.click(
      card('operator').getByRole('checkbox', { name: 'Hisobotlar' }),
    )
    fireEvent.click(card('operator').getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updatePermissionsMock).toHaveBeenCalledTimes(1))
    expect(updatePermissionsMock.mock.calls[0][0]).toEqual({
      id: 1,
      role: 'operator',
      permissions: { ...operatorPermissions, can_view_reports: false },
    })

    expect(card('kassir').queryByRole('checkbox')).not.toBeInTheDocument()
    expect(card('kassir').getAllByText("Ko'rinadi")).toHaveLength(1)
  })

  it('kassir ustuni tahrirlanganda faqat role=kassir bilan yuboriladi', async () => {
    updatePermissionsMock.mockResolvedValue({
      ...kassirPermissions,
      can_view_sessions: true,
    })
    renderCard()
    await waitForBothCards()

    fireEvent.click(card('kassir').getByRole('button', { name: /Tahrirlash/ }))
    fireEvent.click(
      card('kassir').getByRole('checkbox', { name: 'Sessiyalar' }),
    )
    fireEvent.click(card('kassir').getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updatePermissionsMock).toHaveBeenCalledTimes(1))
    expect(updatePermissionsMock.mock.calls[0][0]).toEqual({
      id: 1,
      role: 'kassir',
      permissions: { ...kassirPermissions, can_view_sessions: true },
    })

    expect(card('operator').queryByRole('checkbox')).not.toBeInTheDocument()
    expect(card('operator').getAllByText("Ko'rinadi")).toHaveLength(7)
  })
})
