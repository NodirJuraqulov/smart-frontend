import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import CapacityCard from './CapacityCard'

const { updateCapacityMock } = vi.hoisted(() => ({
  updateCapacityMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  updateCapacity: updateCapacityMock,
}))

function renderCard(capacityTotal: number | null) {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <CapacityCard orgId={1} capacityTotal={capacityTotal} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('CapacityCard', () => {
  beforeEach(() => {
    updateCapacityMock.mockReset()
  })

  it("mavjud qiymatni inputga to'ldiradi", () => {
    renderCard(50)
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  it("Saqlash bosilganda to'g'ri org id va qiymat bilan yuboriladi (regression)", async () => {
    updateCapacityMock.mockResolvedValue({})
    renderCard(50)

    fireEvent.change(screen.getByDisplayValue('50'), {
      target: { value: '80' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateCapacityMock).toHaveBeenCalled())
    expect(updateCapacityMock.mock.calls[0][0]).toEqual({
      id: 1,
      capacity_total: 80,
    })
  })

  it("input bo'sh qoldirilsa capacity_total null yuboriladi (cheksiz)", async () => {
    updateCapacityMock.mockResolvedValue({})
    renderCard(50)

    fireEvent.change(screen.getByDisplayValue('50'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateCapacityMock).toHaveBeenCalled())
    expect(updateCapacityMock.mock.calls[0][0]).toEqual({
      id: 1,
      capacity_total: null,
    })
  })
})
