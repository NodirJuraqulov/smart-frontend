import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import ActiveSessionsTab from './ActiveSessionsTab'
import type { ParkingSession, SessionsResponse } from '@/types/parking'
import type { UserRole } from '@/types/auth'

const { getSessionsMock, useAppSelectorMock } = vi.hoisted(() => ({
  getSessionsMock: vi.fn(),
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/api/parking', () => ({
  getSessions: getSessionsMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

const activeSession: ParkingSession = {
  id: 1,
  org_id: 1,
  plate_number: '01A123BC',
  entered_at: '2026-08-26T08:00:00.000Z',
  exited_at: null,
  duration_minutes: 60,
  amount: 15000,
  status: 'active',
  entry_method: 'auto',
  exit_method: null,
  entryOverviewImageUrl: '/api/parking/sessions/1/images/entry-overview',
  operator_id: null,
  created_at: '2026-08-26T08:00:00.000Z',
}

const response: SessionsResponse = {
  sessions: [activeSession],
  pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
}

function renderTab(role: UserRole) {
  useAppSelectorMock.mockImplementation(
    (selector: (state: unknown) => unknown) =>
      selector({ auth: { user: { role } } }),
  )
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdApp>
          <ActiveSessionsTab />
        </AntdApp>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('ActiveSessionsTab', () => {
  beforeEach(() => {
    getSessionsMock.mockReset().mockResolvedValue(response)
    useAppSelectorMock.mockReset()
  })

  it('registrator uchun faqat raqam, kirish vaqti va rasmni ko‘rsatadi', async () => {
    renderTab('registrator')

    expect(await screen.findByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nomer' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Kirdi' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Rasmlar' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Chiqdi' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Summa' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Amallar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Majburan yopish' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: "Rasmlarni ko'rish" }),
    ).toBeInTheDocument()
  })

  it.each<UserRole>(['owner', 'operator', 'registrator'])(
    '%s uchun faol sessiya qidiruvi plate_number bilan ishlaydi',
    async (role) => {
      renderTab(role)

      await screen.findByText('01A123BC')
      fireEvent.change(screen.getByPlaceholderText("Nomer bo'yicha qidirish"), {
        target: { value: '01A' },
      })

      await waitFor(() =>
        expect(getSessionsMock).toHaveBeenLastCalledWith({
          page: 1,
          limit: 20,
          status: 'active',
          plate_number: '01A',
        }),
      )
      await waitFor(() => expect(screen.getByText('01A123BC')).toBeInTheDocument())
      if (role === 'registrator') {
        expect(
          screen.queryByRole('button', { name: /Majburan yopish/ }),
        ).not.toBeInTheDocument()
      } else {
        expect(
          screen.getByRole('button', { name: /Majburan yopish/ }),
        ).toBeInTheDocument()
      }
    },
  )

  it("faol sessiyalarni status='active' kontrakti bilan oladi", async () => {
    renderTab('registrator')

    await waitFor(() =>
      expect(getSessionsMock).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: 'active',
        plate_number: undefined,
      }),
    )
  })
})
