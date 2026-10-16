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
import dayjs from 'dayjs'
import CancelledExitHistoryTab from './CancelledExitHistoryTab'
import { formatDate } from '@/utils/format'
import type { CancelledExitHistoryResponse } from '@/types/exitCandidate'

const { getCancelledExitCandidatesMock, axiosGetMock } = vi.hoisted(() => ({
  getCancelledExitCandidatesMock: vi.fn(),
  axiosGetMock: vi.fn(),
}))

vi.mock('@/api/exitCandidates', () => ({
  getCancelledExitCandidates: getCancelledExitCandidatesMock,
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: { get: axiosGetMock },
}))

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  const DatePicker = {
    ...actual.DatePicker,
    RangePicker: ({
      onChange,
      'aria-label': ariaLabel,
    }: {
      onChange: (range: [dayjs.Dayjs, dayjs.Dayjs]) => void
      'aria-label': string
    }) => (
      <div aria-label={ariaLabel}>
        <button
          type="button"
          onClick={() =>
            onChange([dayjs('2026-09-15'), dayjs('2026-10-15')])
          }
        >
          31 kun
        </button>
        <button
          type="button"
          onClick={() =>
            onChange([dayjs('2026-09-14'), dayjs('2026-10-15')])
          }
        >
          32 kun
        </button>
      </div>
    ),
  }
  return { ...actual, DatePicker }
})

const cameraEventAt = '2026-10-14T08:30:00.000Z'

const response: CancelledExitHistoryResponse = {
  history: [
    {
      id: 123,
      detected_plate: '01A123BC',
      confidence: 92.5,
      camera_event_at: cameraEventAt,
      resolved_at: '2026-10-14T08:31:00.000Z',
      resolved_by: { id: 7, name: 'Operator' },
      webhook_event_id: 456,
      has_image: true,
      image_url: '/api/webhook-events/456/images/overview',
    },
    {
      id: 124,
      detected_plate: null,
      confidence: 81,
      camera_event_at: '2026-10-14T08:40:00.000Z',
      resolved_at: '2026-10-14T08:41:00.000Z',
      webhook_event_id: 457,
      has_image: false,
      image_url: null,
    },
    {
      id: 125,
      detected_plate: null,
      confidence: 79,
      camera_event_at: '2026-10-14T08:50:00.000Z',
      resolved_at: '2026-10-14T08:51:00.000Z',
      resolved_by: { id: 8, name: null },
      webhook_event_id: 458,
      has_image: false,
      image_url: null,
    },
  ],
  pagination: { page: 1, limit: 20, total: 41, total_pages: 3 },
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <CancelledExitHistoryTab />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('CancelledExitHistoryTab', () => {
  beforeEach(() => {
    getCancelledExitCandidatesMock.mockReset().mockImplementation(
      (params: { page: number }) =>
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
      createObjectURL: vi.fn(() => 'blob:cancelled-exit-image'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('default bugungi sana bilan ma’lumotlarni ko‘rsatadi', async () => {
    renderTab()

    const today = dayjs().format('YYYY-MM-DD')
    expect(await screen.findByText('01A123BC')).toBeInTheDocument()
    expect(screen.getByText(formatDate(cameraEventAt))).toBeInTheDocument()
    expect(screen.getByText('92.5%')).toBeInTheDocument()
    expect(screen.getByText('Operator')).toBeInTheDocument()
    expect(getCancelledExitCandidatesMock).toHaveBeenCalledWith({
      from: today,
      to: today,
      page: 1,
      limit: 20,
    })
  })

  it('nomer va operator bo‘lmagan qatorni xatosiz ko‘rsatadi', async () => {
    renderTab()

    const row = (await screen.findByText('81%')).closest('tr')
    expect(row).not.toBeNull()
    expect(within(row!).getAllByText('-')).toHaveLength(3)

    const unnamedResolverRow = screen.getByText('79%').closest('tr')
    expect(within(unnamedResolverRow!).getAllByText('-')).toHaveLength(3)
  })

  it('rasmni kattalashtiradi va rasm yo‘q qatorga belgi chiqaradi', async () => {
    renderTab()

    const thumbnail = await screen.findByRole('button', {
      name: "01A123BC — chiqish bo'lmagan holat rasmi",
    })
    fireEvent.click(thumbnail)

    const preview = await screen.findByRole('dialog', {
      name: "01A123BC — chiqish bo'lmagan holat rasmi",
    })
    expect(
      within(preview).getByRole('img', {
        name: "01A123BC — chiqish bo'lmagan holat rasmi",
      }),
    ).toHaveAttribute('src', 'blob:cancelled-exit-image')

    const noImageRow = screen.getByText('81%').closest('tr')
    expect(within(noImageRow!).getAllByText('-')).toHaveLength(3)
  })

  it('so‘rov davomida loading holatini ko‘rsatadi', () => {
    getCancelledExitCandidatesMock.mockReturnValue(new Promise(() => {}))

    const { container } = renderTab()

    expect(container.querySelector('.ant-spin-spinning')).toBeInTheDocument()
  })

  it('bo‘sh javobda Empty holatini ko‘rsatadi', async () => {
    getCancelledExitCandidatesMock.mockResolvedValue({
      history: [],
      pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
    })

    renderTab()

    expect(
      await screen.findByText("Chiqish bo'lmagan holatlar topilmadi"),
    ).toBeInTheDocument()
  })

  it('xatoda Alert ko‘rsatadi va qayta urinishni bajaradi', async () => {
    getCancelledExitCandidatesMock
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(response)

    renderTab()

    expect(
      await screen.findByText("Ma'lumotlarni yuklab bo'lmadi"),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }))

    expect(await screen.findByText('01A123BC')).toBeInTheDocument()
    expect(getCancelledExitCandidatesMock).toHaveBeenCalledTimes(2)
  })

  it('sana oralig‘i va sahifa o‘zgarganda qayta so‘raydi', async () => {
    renderTab()
    await screen.findByText('01A123BC')

    fireEvent.click(screen.getByRole('button', { name: '31 kun' }))

    await waitFor(() =>
      expect(getCancelledExitCandidatesMock).toHaveBeenCalledWith({
        from: '2026-09-15',
        to: '2026-10-15',
        page: 1,
        limit: 20,
      }),
    )

    fireEvent.click(await screen.findByTitle('2'))

    await waitFor(() =>
      expect(getCancelledExitCandidatesMock).toHaveBeenCalledWith({
        from: '2026-09-15',
        to: '2026-10-15',
        page: 2,
        limit: 20,
      }),
    )
  })

  it('31 kundan katta oraliqda so‘rov yubormaydi va xabar ko‘rsatadi', async () => {
    renderTab()
    await screen.findByText('01A123BC')
    getCancelledExitCandidatesMock.mockClear()

    fireEvent.click(screen.getByRole('button', { name: '32 kun' }))

    expect(
      await screen.findByText('Oraliq 31 kundan oshmasligi kerak'),
    ).toBeInTheDocument()
    expect(getCancelledExitCandidatesMock).not.toHaveBeenCalled()
  })
})
