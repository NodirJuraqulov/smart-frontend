import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExitControlReportBlock from './ExitControlReportBlock'

const { getExitControlReportMock } = vi.hoisted(() => ({
  getExitControlReportMock: vi.fn(),
}))

vi.mock('@/api/reports', () => ({
  getExitControlReport: getExitControlReportMock,
}))

const report = {
  estimated: true,
  avg_loss_som: 10000,
  from: '2026-10-13',
  to: '2026-10-14',
  days: [
    {
      date: '2026-10-13',
      not_found_count: 20,
      forced_open_count: 15,
      forced_open_unknown_or_regular: 12,
      forced_open_vip_or_subscription: 3,
      estimated_loss_som: 120000,
    },
  ],
  totals: {
    not_found_count: 38,
    forced_open_count: 28,
    forced_open_unknown_or_regular: 23,
    forced_open_vip_or_subscription: 5,
    estimated_loss_som: 230000,
  },
}

function renderBlock() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitControlReportBlock from="2026-10-13" to="2026-10-14" />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ExitControlReportBlock', () => {
  beforeEach(() => {
    getExitControlReportMock.mockReset().mockResolvedValue(report)
  })

  it('kunlik qiymatlar, jami va avg_loss_som tooltipini ko‘rsatadi', async () => {
    renderBlock()

    expect(screen.getByText('Chiqish nazorati')).toBeInTheDocument()
    expect(await screen.findByText('2026-10-13')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText("120 000 so'm")).toBeInTheDocument()
    expect(screen.getByText('Jami')).toBeInTheDocument()
    expect(screen.getByText('38')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText("230 000 so'm")).toBeInTheDocument()

    fireEvent.mouseOver(screen.getAllByText('Taxminiy')[0])
    expect(
      await screen.findByText(
        "o‘rtacha 10 000 so‘m bo‘yicha hisoblangan, real to‘lov emas",
      ),
    ).toBeInTheDocument()
    expect(getExitControlReportMock).toHaveBeenCalledWith({
      from: '2026-10-13',
      to: '2026-10-14',
    })
  })

  it('so‘rov davomida loading holatini ko‘rsatadi', () => {
    getExitControlReportMock.mockReturnValue(new Promise(() => undefined))

    renderBlock()

    expect(screen.getByTestId('exit-control-loading')).toBeInTheDocument()
  })

  it('days bo‘sh bo‘lsa bo‘sh holatni ko‘rsatadi', async () => {
    getExitControlReportMock.mockResolvedValue({ ...report, days: [] })

    renderBlock()

    expect(
      await screen.findByText('Chiqish nazorati ma’lumotlari topilmadi'),
    ).toBeInTheDocument()
  })

  it('xatoda Alert va qayta urinish tugmasini ko‘rsatadi', async () => {
    getExitControlReportMock
      .mockRejectedValueOnce(new Error('network failed'))
      .mockResolvedValueOnce(report)
    renderBlock()

    expect(
      await screen.findByText('Chiqish nazoratini yuklab bo‘lmadi'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Qayta urinish' }))

    await waitFor(() =>
      expect(getExitControlReportMock).toHaveBeenCalledTimes(2),
    )
    expect(await screen.findByText('2026-10-13')).toBeInTheDocument()
  })

  it('yangi maydonlar bo‘lmagan javobda xatosiz bo‘sh holatga qaytadi', async () => {
    getExitControlReportMock.mockResolvedValue({})

    renderBlock()

    expect(
      await screen.findByText('Chiqish nazorati ma’lumotlari topilmadi'),
    ).toBeInTheDocument()
  })

  it('totals bo‘lmasa jami qiymatlarni days qatorlaridan hisoblaydi', async () => {
    getExitControlReportMock.mockResolvedValue({
      ...report,
      days: [
        report.days[0],
        {
          ...report.days[0],
          date: '2026-10-14',
          not_found_count: 4,
          forced_open_count: 2,
          forced_open_vip_or_subscription: 1,
          estimated_loss_som: 30000,
        },
      ],
      totals: undefined,
    })

    renderBlock()

    expect(await screen.findByText('2026-10-14')).toBeInTheDocument()
    const totalRow = screen.getByText('Jami').closest('tr')
    expect(totalRow).not.toBeNull()
    expect(within(totalRow!).getByText('24')).toBeInTheDocument()
    expect(within(totalRow!).getByText('17')).toBeInTheDocument()
    expect(within(totalRow!).getByText('4')).toBeInTheDocument()
    expect(within(totalRow!).getByText("150 000 so'm")).toBeInTheDocument()
  })
})
