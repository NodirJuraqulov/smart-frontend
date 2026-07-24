import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PermissionRoute from './PermissionRoute'
import type { OperatorPermissions } from '@/types/permissions'
import type { UserRole } from '@/types/auth'

const { useAppSelectorMock } = vi.hoisted(() => ({
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

const allowAll: OperatorPermissions = {
  can_view_dashboard: true,
  can_view_sessions: true,
  can_view_reports: true,
  can_view_tariffs: true,
  can_view_subscriptions: true,
  can_view_settings: true,
  can_view_activity_log: true,
}

function renderWithUser(
  permissions: OperatorPermissions | undefined,
  role: UserRole = 'operator',
) {
  useAppSelectorMock.mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({ auth: { user: { role, permissions } } }),
  )
  render(
    <MemoryRouter initialEntries={['/operator/reports']}>
      <Routes>
        <Route path="/403" element={<div>Forbidden page</div>} />
        <Route element={<PermissionRoute permission="can_view_reports" />}>
          <Route path="/operator/reports" element={<div>Reports page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('PermissionRoute', () => {
  it('ruxsat true bolsa sahifani korsatadi', () => {
    renderWithUser(allowAll)
    expect(screen.getByText('Reports page')).toBeInTheDocument()
  })

  it("ruxsat false bolsa /403 ga yonaltiradi (regression)", () => {
    renderWithUser({ ...allowAll, can_view_reports: false })
    expect(screen.getByText('Forbidden page')).toBeInTheDocument()
    expect(screen.queryByText('Reports page')).not.toBeInTheDocument()
  })

  it("permissions umuman yuklanmagan bolsa (undefined) sahifani bloklamaydi", () => {
    renderWithUser(undefined)
    expect(screen.getByText('Reports page')).toBeInTheDocument()
  })

  it("role==='owner' bolsa ruxsat false bolsa ham sahifani korsatadi (regression)", () => {
    renderWithUser({ ...allowAll, can_view_reports: false }, 'owner')
    expect(screen.getByText('Reports page')).toBeInTheDocument()
    expect(screen.queryByText('Forbidden page')).not.toBeInTheDocument()
  })
})
