import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import InpatientVehiclesTab from './InpatientVehiclesTab'
import type { InpatientVehicle } from '@/types/inpatientVehicle'

const { getInpatientVehiclesMock, cancelInpatientVehicleMock, useAppSelectorMock } =
  vi.hoisted(() => ({
    getInpatientVehiclesMock: vi.fn(),
    cancelInpatientVehicleMock: vi.fn(),
    useAppSelectorMock: vi.fn(),
  }))

vi.mock('@/api/inpatientVehicles', () => ({
  getInpatientVehicles: getInpatientVehiclesMock,
  cancelInpatientVehicle: cancelInpatientVehicleMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

function renderTab() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdApp>
          <InpatientVehiclesTab />
        </AntdApp>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

describe('InpatientVehiclesTab', () => {
  beforeEach(() => {
    getInpatientVehiclesMock.mockReset()
    cancelInpatientVehicleMock.mockReset()
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ auth: { user: { role: 'owner', org_id: 1 } } }),
    )
  })

  it("statsionar bemorlarni togri korsatadi va qolgan kunlarni togri hisoblaydi", async () => {
    const validUntil = new Date(Date.now() + 3 * 86400000)
    const vehicle: InpatientVehicle = {
      id: 9,
      org_id: 1,
      plate_number: '01B999BB',
      patient_reference: 'ref-9',
      patient_name: 'Aliyev Vali',
      valid_from: '2026-08-01',
      valid_until: validUntil.toISOString().slice(0, 10),
      status: 'active',
      created_at: '2026-08-01T08:00:00.000Z',
      cancelled_by: null,
      cancelled_at: null,
    }
    getInpatientVehiclesMock.mockResolvedValue({
      vehicles: [vehicle],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    })

    renderTab()

    expect(await screen.findByText('01B999BB')).toBeInTheDocument()
    expect(screen.getByText('Aliyev Vali')).toBeInTheDocument()
    expect(screen.getByText('3 kun')).toBeInTheDocument()
    expect(getInpatientVehiclesMock).toHaveBeenCalledWith(1, {
      status: 'active',
      page: 1,
      limit: 10,
    })
  })

  it("Bekor qilish tugmasi togri chaqiriladi va royxat yangilanadi", async () => {
    const vehicle: InpatientVehicle = {
      id: 9,
      org_id: 1,
      plate_number: '01B999BB',
      patient_reference: null,
      patient_name: null,
      valid_from: '2026-08-01',
      valid_until: '2026-08-10',
      status: 'active',
      created_at: '2026-08-01T08:00:00.000Z',
      cancelled_by: null,
      cancelled_at: null,
    }
    getInpatientVehiclesMock.mockResolvedValue({
      vehicles: [vehicle],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    })
    cancelInpatientVehicleMock.mockResolvedValue({
      ...vehicle,
      status: 'cancelled',
    })

    renderTab()

    await screen.findByText('01B999BB')
    screen.getByRole('button', { name: 'Bekor qilish' }).click()
    ;(await screen.findByText('OK')).click()

    await waitFor(() =>
      expect(cancelInpatientVehicleMock).toHaveBeenCalledWith({
        orgId: 1,
        vehicleId: 9,
      }),
    )
    await waitFor(() =>
      expect(getInpatientVehiclesMock).toHaveBeenCalledTimes(2),
    )
  })
})
