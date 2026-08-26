import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import EmergencyExitHistoryTab from './EmergencyExitHistoryTab'
import { formatDate } from '@/utils/format'
import type { EmergencyExitHistoryResponse } from '@/types/emergencyExitHistory'

const { getEmergencyExitHistoryMock } = vi.hoisted(() => ({
  getEmergencyExitHistoryMock: vi.fn(),
}))

vi.mock('@/api/emergencyExitHistory', () => ({
  getEmergencyExitHistory: getEmergencyExitHistoryMock,
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url: string; alt: string }) => (
    <img src={url} alt={alt} />
  ),
}))

const confirmedAt = '2026-08-25T08:30:00.000Z'
const forcedAt = '2026-08-25T08:31:00.000Z'

const response: EmergencyExitHistoryResponse = {
  history: [
    {
      id: 'candidate:92',
      source: 'exit_candidate',
      session_id: null,
      candidate_id: 92,
      plate_number: '01E200AA',
      occurred_at: forcedAt,
      confirmed_by: { id: 12, name: 'Alisher Karimov' },
      type: 'forced_open',
      resolution_note: '103 chaqiruvi',
      image_url: '/api/webhook-events/45/images/vehicle',
    },
    {
      id: 'session:91',
      source: 'parking_session',
      session_id: 91,
      candidate_id: 90,
      plate_number: '01E100AA',
      occurred_at: confirmedAt,
      confirmed_by: { id: 13, name: 'Bekzod Aliyev' },
      type: 'confirmed',
      resolution_note: null,
      image_url: null,
    },
  ],
  pagination: { page: 1, limit: 20, total: 41, total_pages: 3 },
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EmergencyExitHistoryTab orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('EmergencyExitHistoryTab', () => {
  beforeEach(() => {
    getEmergencyExitHistoryMock.mockReset().mockImplementation(
      (_orgId: number, params: { page: number; limit: number }) =>
        Promise.resolve({
          ...response,
          pagination: { ...response.pagination, page: params.page },
        }),
    )
  })

  it('backend ma’lumotlari va barcha ustunlarni to‘g‘ri ko‘rsatadi', async () => {
    renderTab()

    expect(await screen.findByText('01E200AA')).toBeInTheDocument()
    expect(screen.getByText('01E100AA')).toBeInTheDocument()
    expect(screen.getByText(formatDate(forcedAt))).toBeInTheDocument()
    expect(screen.getByText(formatDate(confirmedAt))).toBeInTheDocument()
    expect(screen.getByText('Alisher Karimov')).toBeInTheDocument()
    expect(screen.getByText('Bekzod Aliyev')).toBeInTheDocument()
    expect(screen.getByText('Majburiy ochish')).toBeInTheDocument()
    expect(screen.getByText('Oddiy tasdiqlash')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: '01E200AA — tez yordam rasmi' }),
    ).toHaveAttribute('src', '/api/webhook-events/45/images/vehicle')
    expect(getEmergencyExitHistoryMock).toHaveBeenCalledWith(7, {
      page: 1,
      limit: 20,
    })
  })

  it('pagination sahifasi o‘zgarganda yangi page bilan so‘rov yuboradi', async () => {
    renderTab()

    fireEvent.click(await screen.findByTitle('2'))

    await waitFor(() =>
      expect(getEmergencyExitHistoryMock).toHaveBeenCalledWith(7, {
        page: 2,
        limit: 20,
      }),
    )
  })
})
