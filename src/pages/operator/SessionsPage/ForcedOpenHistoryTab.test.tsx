import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ForcedOpenHistoryTab from './ForcedOpenHistoryTab'
import { formatDate } from '@/utils/format'
import type { ForcedOpenHistoryResponse } from '@/types/forcedOpenHistory'

const { getForcedOpenHistoryMock, axiosGetMock } = vi.hoisted(() => ({
  getForcedOpenHistoryMock: vi.fn(),
  axiosGetMock: vi.fn(),
}))

vi.mock('@/api/forcedOpenHistory', () => ({
  getForcedOpenHistory: getForcedOpenHistoryMock,
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: { get: axiosGetMock },
}))

const resolvedAt = '2026-08-21T08:30:00.000Z'

const response: ForcedOpenHistoryResponse = {
  history: [
    {
      id: 91,
      plate_number: '01A123BC',
      resolved_at: resolvedAt,
      resolved_by: { id: 12, name: 'Alisher Karimov' },
      resolution_note: 'Kirish sessiyasi topilmadi',
      image_url: '/api/webhook-events/44/images/overview',
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
        <ForcedOpenHistoryTab orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ForcedOpenHistoryTab', () => {
  beforeEach(() => {
    getForcedOpenHistoryMock.mockReset().mockImplementation(
      (_orgId: number, params: { page: number; limit: number }) =>
        Promise.resolve({
          ...response,
          pagination: { ...response.pagination, page: params.page },
        }),
    )
    axiosGetMock.mockReset().mockResolvedValue({
      data: new Blob(['image'], { type: 'image/jpeg' }),
    })
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:forced-open-image'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('jadvalda backend ma’lumotlarini to‘g‘ri ko‘rsatadi', async () => {
    renderTab()

    expect(await screen.findByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByText(formatDate(resolvedAt))).toBeInTheDocument()
    expect(screen.getByText('Alisher Karimov')).toBeInTheDocument()
    expect(screen.getByText('Kirish sessiyasi topilmadi')).toBeInTheDocument()
    expect(getForcedOpenHistoryMock).toHaveBeenCalledWith(7, {
      page: 1,
      limit: 20,
    })
  })

  it('pagination sahifasi o‘zgarganda yangi page bilan so‘rov yuboradi', async () => {
    renderTab()

    fireEvent.click(await screen.findByTitle('2'))

    await waitFor(() =>
      expect(getForcedOpenHistoryMock).toHaveBeenCalledWith(7, {
        page: 2,
        limit: 20,
      }),
    )
  })

  it('thumbnail bosilganda rasm previewini ochadi', async () => {
    renderTab()

    const thumbnail = await screen.findByRole('button', {
      name: '01A123BC — majburiy ochish rasmi',
    })
    fireEvent.click(thumbnail)

    const preview = await screen.findByRole('dialog', {
      name: '01A123BC — majburiy ochish rasmi',
    })
    expect(
      within(preview).getByRole('img', {
        name: '01A123BC — majburiy ochish rasmi',
      }),
    ).toHaveAttribute('src', 'blob:forced-open-image')
  })
})
