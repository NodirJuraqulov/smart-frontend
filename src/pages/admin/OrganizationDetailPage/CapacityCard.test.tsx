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

const queryClient = new QueryClient()

function renderCard(capacityTotal: number | null) {
  return render(
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

  it("korish rejimida joriy qiymatni korsatadi", () => {
    renderCard(50)
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it("qiymat bolmasa 'Cheksiz' korsatadi", () => {
    renderCard(null)
    expect(screen.getByText('Cheksiz')).toBeInTheDocument()
  })

  it("Tahrirlash bosilganda joriy qiymat bilan toldirilgan forma ochiladi", () => {
    renderCard(50)
    fireEvent.click(screen.getByRole('button', { name: /Tahrirlash/ }))
    expect(screen.getByDisplayValue('50')).toBeInTheDocument()
  })

  it("Saqlash bosilganda to'g'ri org id va qiymat bilan yuboriladi (regression)", async () => {
    updateCapacityMock.mockResolvedValue({})
    renderCard(50)

    fireEvent.click(screen.getByRole('button', { name: /Tahrirlash/ }))
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

    fireEvent.click(screen.getByRole('button', { name: /Tahrirlash/ }))
    fireEvent.change(screen.getByDisplayValue('50'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateCapacityMock).toHaveBeenCalled())
    expect(updateCapacityMock.mock.calls[0][0]).toEqual({
      id: 1,
      capacity_total: null,
    })
  })

  it("Saqlashdan keyin Korish rejimiga qaytadi va yangi qiymatni korsatadi (regression)", async () => {
    updateCapacityMock.mockResolvedValue({})
    const { rerender } = renderCard(50)

    fireEvent.click(screen.getByRole('button', { name: /Tahrirlash/ }))
    fireEvent.change(screen.getByDisplayValue('50'), {
      target: { value: '80' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateCapacityMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Tahrirlash/ })).toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: 'Saqlash' })).not.toBeInTheDocument()

    rerender(
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <CapacityCard orgId={1} capacityTotal={80} />
        </AntdApp>
      </QueryClientProvider>,
    )
    expect(screen.getByText('80')).toBeInTheDocument()
  })

  it("Bekor qilish saqlashsiz korish rejimiga qaytaradi", () => {
    renderCard(50)
    fireEvent.click(screen.getByRole('button', { name: /Tahrirlash/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    expect(updateCapacityMock).not.toHaveBeenCalled()
    expect(screen.getByText('50')).toBeInTheDocument()
  })
})
