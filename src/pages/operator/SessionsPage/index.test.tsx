import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SessionsPage from './index'
import type { UserRole } from '@/types/auth'

const { useAppSelectorMock } = vi.hoisted(() => ({
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

vi.mock('./ActiveSessionsTab', () => ({
  default: () => <div>active-content</div>,
}))

vi.mock('./HistorySessionsTab', () => ({
  default: () => <div>history-content</div>,
}))

vi.mock('./ForcedOpenHistoryTab', () => ({
  default: () => <div>forced-open-content</div>,
}))

function renderPage(role: UserRole) {
  useAppSelectorMock.mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({
        auth: {
          user: { role, org_id: role === 'super_admin' ? null : 7 },
        },
      }),
  )
  render(<SessionsPage />)
}

describe('SessionsPage forced open tab visibility', () => {
  beforeEach(() => {
    useAppSelectorMock.mockReset()
  })

  it.each<UserRole>(['owner', 'kassir', 'super_admin'])(
    '%s uchun Majburiy ochilganlar tabini ko‘rsatadi',
    (role) => {
      renderPage(role)

      expect(
        screen.getByRole('tab', { name: 'Majburiy ochilganlar' }),
      ).toBeInTheDocument()
    },
  )

  it('operator uchun Majburiy ochilganlar tabini yashiradi', () => {
    renderPage('operator')

    expect(
      screen.queryByRole('tab', { name: 'Majburiy ochilganlar' }),
    ).not.toBeInTheDocument()
  })
})
