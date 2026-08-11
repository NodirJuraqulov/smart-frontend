import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import EmergencyBarrierSettingsCard from './EmergencyBarrierSettingsCard'

const { getEmergencyBarrierSettingsMock, updateEmergencyBarrierSettingsMock } =
  vi.hoisted(() => ({
    getEmergencyBarrierSettingsMock: vi.fn(),
    updateEmergencyBarrierSettingsMock: vi.fn(),
  }))

vi.mock('@/api/organizations', () => ({
  getEmergencyBarrierSettings: getEmergencyBarrierSettingsMock,
  updateEmergencyBarrierSettings: updateEmergencyBarrierSettingsMock,
}))

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EmergencyBarrierSettingsCard orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('EmergencyBarrierSettingsCard', () => {
  beforeEach(() => {
    getEmergencyBarrierSettingsMock
      .mockReset()
      .mockResolvedValue({ emergency_barrier_button_enabled: false })
    updateEmergencyBarrierSettingsMock.mockReset()
  })

  it('GET orqali joriy holatni yuklaydi', async () => {
    getEmergencyBarrierSettingsMock.mockResolvedValue({
      emergency_barrier_button_enabled: true,
    })
    renderCard()

    await waitFor(() =>
      expect(getEmergencyBarrierSettingsMock).toHaveBeenCalledWith(7),
    )
    expect(await screen.findByRole('switch')).toBeChecked()
  })

  it('toggle yoqilganda PATCH true bilan chaqiriladi', async () => {
    updateEmergencyBarrierSettingsMock.mockResolvedValue({
      emergency_barrier_button_enabled: true,
    })
    renderCard()

    const toggle = await screen.findByRole('switch')
    expect(toggle).not.toBeChecked()
    fireEvent.click(toggle)

    await waitFor(() =>
      expect(updateEmergencyBarrierSettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        enabled: true,
      }),
    )
    await waitFor(() => expect(screen.getByRole('switch')).toBeChecked())
    expect(await screen.findByText('Sozlama saqlandi')).toBeInTheDocument()
  })

  it('toggle oʻchirilganda PATCH false bilan chaqiriladi', async () => {
    getEmergencyBarrierSettingsMock.mockResolvedValue({
      emergency_barrier_button_enabled: true,
    })
    updateEmergencyBarrierSettingsMock.mockResolvedValue({
      emergency_barrier_button_enabled: false,
    })
    renderCard()

    const toggle = await screen.findByRole('switch')
    await waitFor(() => expect(toggle).toBeChecked())
    fireEvent.click(toggle)

    await waitFor(() =>
      expect(updateEmergencyBarrierSettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        enabled: false,
      }),
    )
    await waitFor(() => expect(screen.getByRole('switch')).not.toBeChecked())
  })

  it('PATCH xatosida xabar koʻrsatiladi va holat oʻzgarmaydi', async () => {
    updateEmergencyBarrierSettingsMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 403, data: { message: 'Ruxsat yoʻq' } },
    })
    renderCard()

    const toggle = await screen.findByRole('switch')
    fireEvent.click(toggle)

    expect(await screen.findByText('Ruxsat yoʻq')).toBeInTheDocument()
    expect(screen.getByRole('switch')).not.toBeChecked()
  })
})
