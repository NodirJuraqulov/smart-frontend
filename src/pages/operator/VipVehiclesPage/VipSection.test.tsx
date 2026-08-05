import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import VipSection from './VipSection'

const {
  getVipVehiclesMock,
  createVipVehicleMock,
  updateVipVehicleMock,
  deleteVipVehicleMock,
} = vi.hoisted(() => ({
  getVipVehiclesMock: vi.fn(),
  createVipVehicleMock: vi.fn(),
  updateVipVehicleMock: vi.fn(),
  deleteVipVehicleMock: vi.fn(),
}))

vi.mock('@/api/vipVehicles', () => ({
  getVipVehicles: getVipVehiclesMock,
  createVipVehicle: createVipVehicleMock,
  updateVipVehicle: updateVipVehicleMock,
  deleteVipVehicle: deleteVipVehicleMock,
}))

function renderSection() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <VipSection />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('VipSection', () => {
  beforeEach(() => {
    getVipVehiclesMock.mockReset()
    createVipVehicleMock.mockReset()
    updateVipVehicleMock.mockReset()
    deleteVipVehicleMock.mockReset()
  })

  it("'Yangi VIP qo'shish' orqali VIP mashina qo'shadi (regression)", async () => {
    getVipVehiclesMock.mockResolvedValue([])
    createVipVehicleMock.mockResolvedValue({
      id: 1,
      org_id: 1,
      plate_number: '01A777BA',
      note: 'Direktor mashinasi',
      created_at: '2026-07-01T00:00:00.000Z',
    })
    renderSection()

    fireEvent.click(
      await screen.findByRole('button', { name: /Yangi VIP qo'shish/ }),
    )
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01A777BA'), {
      target: { value: '01A777BA' },
    })
    fireEvent.change(screen.getByPlaceholderText('Izoh (ixtiyoriy)'), {
      target: { value: 'Direktor mashinasi' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(createVipVehicleMock).toHaveBeenCalled())
    expect(createVipVehicleMock.mock.calls[0][0]).toEqual({
      plate_number: '01A777BA',
      note: 'Direktor mashinasi',
    })
  })
})
