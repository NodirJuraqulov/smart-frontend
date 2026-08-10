import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ReportsPage from './index'
import type { UserRole } from '@/types/auth'

const { useAppSelectorMock } = vi.hoisted(() => ({
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

vi.mock('./DailyReportTab', () => ({
  default: () => <div data-testid="daily-tab" />,
}))
vi.mock('./MonthlyReportTab', () => ({
  default: () => <div data-testid="monthly-tab" />,
}))
vi.mock('./YearlyReportTab', () => ({
  default: () => <div data-testid="yearly-tab" />,
}))
vi.mock('./CashCollectionHistoryTab', () => ({
  default: ({ orgId }: { orgId: number }) => (
    <div data-testid="cash-collection-history" data-org-id={orgId} />
  ),
}))
vi.mock('./CashCollectionAction', () => ({
  default: ({ orgId }: { orgId: number }) => (
    <button type="button" data-org-id={orgId}>
      Inkassatsiya
    </button>
  ),
}))

function renderPage(role: UserRole, orgId: number | null = 5) {
  useAppSelectorMock.mockReset().mockReturnValue({ role, org_id: orgId })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ReportsPage />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ReportsPage', () => {
  beforeEach(() => {
    useAppSelectorMock.mockReset()
  })

  it.each<UserRole>(['owner', 'kassir', 'super_admin'])(
    '%s uchun Inkassatsiya tugmasi va tarix tabi ko‘rinadi',
    (role) => {
      renderPage(role)

      expect(
        screen.getByRole('button', { name: 'Inkassatsiya' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Inkassatsiya tarixi' })).toBeInTheDocument()
    },
  )

  it('operator uchun Inkassatsiya tugmasi va tarix tabi yashirin', () => {
    renderPage('operator')

    expect(
      screen.queryByRole('button', { name: 'Inkassatsiya' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('tab', { name: 'Inkassatsiya tarixi' }),
    ).not.toBeInTheDocument()
  })

  it('org_id bo‘lmasa inkassatsiya bo‘limi ko‘rsatilmaydi', () => {
    renderPage('owner', null)

    expect(
      screen.queryByRole('button', { name: 'Inkassatsiya' }),
    ).not.toBeInTheDocument()
  })

  it('kunlik/oylik/yillik tablar saqlanadi', () => {
    renderPage('operator')

    expect(screen.getByRole('tab', { name: 'Kunlik' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Oylik' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Yillik' })).toBeInTheDocument()
  })
})
