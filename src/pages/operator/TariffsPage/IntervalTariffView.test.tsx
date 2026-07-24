import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import IntervalTariffView from './IntervalTariffView'
import type { TariffInterval } from '@/types/tariffInterval'

const {
  getTariffIntervalsMock,
  createTariffIntervalMock,
  updateTariffIntervalMock,
  deleteTariffIntervalMock,
} = vi.hoisted(() => ({
  getTariffIntervalsMock: vi.fn(),
  createTariffIntervalMock: vi.fn(),
  updateTariffIntervalMock: vi.fn(),
  deleteTariffIntervalMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getTariffIntervals: getTariffIntervalsMock,
  createTariffInterval: createTariffIntervalMock,
  updateTariffInterval: updateTariffIntervalMock,
  deleteTariffInterval: deleteTariffIntervalMock,
}))

const intervals: TariffInterval[] = [
  {
    id: 1,
    org_id: 1,
    from_minutes: 0,
    to_minutes: 60,
    price: 5000,
    created_at: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 2,
    org_id: 1,
    from_minutes: 60,
    to_minutes: null,
    price: 3000,
    created_at: '2026-07-01T00:00:00.000Z',
  },
]

function renderView() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <IntervalTariffView />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('IntervalTariffView', () => {
  beforeEach(() => {
    getTariffIntervalsMock.mockReset().mockResolvedValue([])
    createTariffIntervalMock.mockReset()
    updateTariffIntervalMock.mockReset()
    deleteTariffIntervalMock.mockReset()
  })

  it("mavjud intervallarni FLAT yol orqali (org id'siz) oladi va jadvalda korsatadi (regression)", async () => {
    getTariffIntervalsMock.mockResolvedValue(intervals)
    renderView()

    await waitFor(() =>
      expect(screen.getByText("5 000 so'm")).toBeInTheDocument(),
    )
    expect(screen.getByText('Cheksiz')).toBeInTheDocument()
    expect(getTariffIntervalsMock).toHaveBeenCalledWith()
  })

  it("Yangi interval yaratish FLAT yol orqali (org id'siz) yuboradi (regression)", async () => {
    createTariffIntervalMock.mockResolvedValue(intervals[0])
    renderView()

    fireEvent.click(
      await screen.findByRole('button', { name: /Yangi interval/ }),
    )

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '0' } })
    fireEvent.change(inputs[1], { target: { value: '60' } })
    fireEvent.change(inputs[2], { target: { value: '5000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(createTariffIntervalMock).toHaveBeenCalled())
    expect(createTariffIntervalMock).toHaveBeenCalledWith({
      from_minutes: 0,
      to_minutes: 60,
      price: 5000,
    })
  })

  it("intervalni tahrirlash FLAT yol orqali id bilan yuboradi (regression)", async () => {
    getTariffIntervalsMock.mockResolvedValue(intervals)
    updateTariffIntervalMock.mockResolvedValue(intervals[0])
    renderView()

    await waitFor(() =>
      expect(screen.getByText("5 000 so'm")).toBeInTheDocument(),
    )
    const editButtons = screen.getAllByRole('button', { name: /Tahrirlash/ })
    fireEvent.click(editButtons[0])

    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[2], { target: { value: '6000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateTariffIntervalMock).toHaveBeenCalled())
    expect(updateTariffIntervalMock).toHaveBeenCalledWith({
      id: 1,
      from_minutes: 0,
      to_minutes: 60,
      price: 6000,
    })
  })

  it("intervalni ochirish FLAT yol orqali id bilan yuboradi (regression)", async () => {
    getTariffIntervalsMock.mockResolvedValue(intervals)
    deleteTariffIntervalMock.mockResolvedValue(undefined)
    renderView()

    await waitFor(() =>
      expect(screen.getByText("5 000 so'm")).toBeInTheDocument(),
    )
    const deleteButtons = screen.getAllByRole('button', { name: /O'chirish/ })
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))

    await waitFor(() => expect(deleteTariffIntervalMock).toHaveBeenCalled())
    expect(deleteTariffIntervalMock.mock.calls[0][0]).toBe(1)
  })
})
