import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import BlacklistPage from './index'
import type {
  BlacklistedVehicle,
  BlacklistAttempt,
} from '@/types/blacklist'

const {
  getBlacklistedVehiclesMock,
  createBlacklistedVehicleMock,
  deleteBlacklistedVehicleMock,
  getBlacklistAttemptsMock,
  acquireSocketMock,
} = vi.hoisted(() => ({
  getBlacklistedVehiclesMock: vi.fn(),
  createBlacklistedVehicleMock: vi.fn(),
  deleteBlacklistedVehicleMock: vi.fn(),
  getBlacklistAttemptsMock: vi.fn(),
  acquireSocketMock: vi.fn(),
}))

vi.mock('@/api/blacklist', () => ({
  getBlacklistedVehicles: getBlacklistedVehiclesMock,
  createBlacklistedVehicle: createBlacklistedVehicleMock,
  deleteBlacklistedVehicle: deleteBlacklistedVehicleMock,
  getBlacklistAttempts: getBlacklistAttemptsMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { user: { role: 'owner', org_id: 7 } } }),
}))

vi.mock('@/services/socket', () => ({
  acquireSocket: acquireSocketMock,
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url: string | null; alt: string }) =>
    url ? <img src={url} alt={alt} /> : null,
}))

const vehicle: BlacklistedVehicle = {
  id: 19,
  org_id: 7,
  plate_number: '01A777BA',
  reason: 'Xavfsizlik',
  created_by: 3,
  created_at: '2026-08-20T08:30:00.000Z',
}

const attempt: BlacklistAttempt = {
  id: 31,
  org_id: 7,
  plate_number: '01B555BB',
  attempted_at: '2026-08-20T09:15:00.000Z',
  image_url: '/api/webhook-events/91/images/overview',
  direction: 'entry',
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <BlacklistPage />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('BlacklistPage', () => {
  beforeEach(() => {
    getBlacklistedVehiclesMock.mockReset().mockResolvedValue([vehicle])
    createBlacklistedVehicleMock.mockReset().mockResolvedValue(vehicle)
    deleteBlacklistedVehicleMock.mockReset().mockResolvedValue(undefined)
    getBlacklistAttemptsMock.mockReset().mockResolvedValue({
      attempts: [attempt],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    })
    acquireSocketMock.mockReset()
  })

  it('qora ro‘yxat jadvalini to‘g‘ri ma’lumot bilan ko‘rsatadi', async () => {
    renderPage()

    expect(await screen.findByText('01A777BA')).toBeInTheDocument()
    expect(screen.getByText('Xavfsizlik')).toBeInTheDocument()
    expect(getBlacklistedVehiclesMock).toHaveBeenCalledWith(7)
  })

  it('yangi yozuvni to‘g‘ri POST ma’lumoti bilan yuboradi', async () => {
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: /Yangi qo'shish/ }),
    )
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01A777BA'), {
      target: { value: '01C333CC' },
    })
    fireEvent.change(screen.getByPlaceholderText('Sabab (ixtiyoriy)'), {
      target: { value: 'Tekshiruv' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() =>
      expect(createBlacklistedVehicleMock).toHaveBeenCalledWith({
        orgId: 7,
        plate_number: '01C333CC',
        reason: 'Tekshiruv',
      }),
    )
  })

  it('o‘chirishni to‘g‘ri organization va yozuv ID bilan yuboradi', async () => {
    renderPage()
    fireEvent.click(
      await screen.findByRole('button', { name: /O'chirish/ }),
    )
    fireEvent.click(await screen.findByText('OK'))

    await waitFor(() =>
      expect(deleteBlacklistedVehicleMock).toHaveBeenCalledWith({
        orgId: 7,
        blacklistId: 19,
      }),
    )
  })

  it('kelgan urinishlarni rasm va pagination so‘rovi bilan ko‘rsatadi', async () => {
    renderPage()

    expect(await screen.findByText('01B555BB')).toBeInTheDocument()
    expect(
      screen.getByAltText('01B555BB mashinasi rasmi'),
    ).toHaveAttribute('src', '/api/webhook-events/91/images/overview')
    expect(getBlacklistAttemptsMock).toHaveBeenCalledWith(7, {
      page: 1,
      limit: 20,
    })
  })

  it('WebSocket listener o‘rnatmaydi', async () => {
    renderPage()

    await screen.findByText('01A777BA')
    expect(acquireSocketMock).not.toHaveBeenCalled()
  })
})
