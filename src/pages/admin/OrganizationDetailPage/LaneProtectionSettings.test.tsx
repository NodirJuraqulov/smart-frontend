import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import LaneProtectionSettings from './LaneProtectionSettings'
import type { IntegrationSettings } from '@/types/organization'

const { updateIntegrationSettingsMock } = vi.hoisted(() => ({
  updateIntegrationSettingsMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  updateIntegrationSettings: updateIntegrationSettingsMock,
}))

const settings: IntegrationSettings = {
  relay_entry_ip: '192.168.1.10',
  relay_exit_ip: '192.168.1.11',
  printer_ip: '192.168.1.20',
  camera_brand: 'hikvision',
  webhook_token: 'token',
  webhook_entry_url: '/entry',
  webhook_exit_url: '/exit',
  webhook_debug_entry_url: '/debug-entry',
  webhook_debug_exit_url: '/debug-exit',
  last_webhook_entry_at: null,
  last_webhook_exit_at: null,
  gate_layout: 'shared',
  cross_camera_guard_seconds: 90,
}

function renderSettings(
  value: IntegrationSettings = settings,
): QueryClient {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <LaneProtectionSettings
          orgId={7}
          settings={value}
          queryKey={['organizations', 7, 'integration-settings']}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return queryClient
}

function secondsInput(): HTMLInputElement {
  return screen.getByRole('spinbutton', {
    name: 'Qarama-qarshi kamera himoya vaqti',
  })
}

function save() {
  fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))
}

describe('LaneProtectionSettings', () => {
  beforeEach(() => {
    updateIntegrationSettingsMock.mockReset()
  })

  it('GETdan kelgan shared va 90 qiymatlarini ko‘rsatadi', () => {
    renderSettings()

    expect(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish bitta umumiy yo‘lakda',
      }),
    ).toBeChecked()
    expect(secondsInput()).toHaveValue('90')
    expect(secondsInput()).toBeEnabled()
  })

  it('GETdan kelgan separate qiymatini ko‘rsatib inputni o‘chiradi', () => {
    renderSettings({ ...settings, gate_layout: 'separate' })

    expect(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish alohida yo‘lakda',
      }),
    ).toBeChecked()
    expect(secondsInput()).toBeDisabled()
    expect(secondsInput()).toHaveValue('90')
  })

  it('shared tanlanganda seconds inputni yoqadi', async () => {
    renderSettings({ ...settings, gate_layout: 'separate' })

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish bitta umumiy yo‘lakda',
      }),
    )

    await waitFor(() => expect(secondsInput()).toBeEnabled())
  })

  it('separate tanlanganda seconds inputni o‘chiradi va qiymatni saqlaydi', async () => {
    renderSettings()

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish alohida yo‘lakda',
      }),
    )

    await waitFor(() => expect(secondsInput()).toBeDisabled())
    expect(secondsInput()).toHaveValue('90')
  })

  it.each([
    ['4', 'Himoya vaqti kamida 5 soniya bo‘lishi kerak'],
    ['301', 'Himoya vaqti 300 soniyadan oshmasligi kerak'],
    ['90.5', 'Himoya vaqti butun son bo‘lishi kerak'],
  ])('%s qiymatini tegishli validatsiya bilan rad etadi', async (value, error) => {
    renderSettings()

    fireEvent.change(secondsInput(), { target: { value } })
    await waitFor(() => expect(secondsInput()).toHaveValue(value))
    save()

    expect(await screen.findByText(error)).toBeInTheDocument()
    expect(updateIntegrationSettingsMock).not.toHaveBeenCalled()
  })

  it('valid shared qiymatlarni va mavjud integration maydonlarini PUTga yuboradi', async () => {
    updateIntegrationSettingsMock.mockResolvedValue(settings)
    renderSettings()

    save()

    await waitFor(() =>
      expect(updateIntegrationSettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        relay_entry_ip: '192.168.1.10',
        relay_exit_ip: '192.168.1.11',
        printer_ip: '192.168.1.20',
        camera_brand: 'hikvision',
        gate_layout: 'shared',
        cross_camera_guard_seconds: 90,
      }),
    )
  })

  it('separate layout bilan saqlangan valid guard qiymatini ham yuboradi', async () => {
    const separateSettings = { ...settings, gate_layout: 'separate' as const }
    updateIntegrationSettingsMock.mockResolvedValue(separateSettings)
    renderSettings(separateSettings)

    save()

    await waitFor(() =>
      expect(updateIntegrationSettingsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          gate_layout: 'separate',
          cross_camera_guard_seconds: 90,
        }),
      ),
    )
  })

  it('muvaffaqiyatli saqlanganda xabar ko‘rsatadi', async () => {
    updateIntegrationSettingsMock.mockResolvedValue(settings)
    renderSettings()

    save()

    expect(
      await screen.findByText(
        'Yo‘lak va kamera himoyasi sozlamalari saqlandi',
      ),
    ).toBeInTheDocument()
  })

  it('backend xatosini mavjud xavfsiz error handling orqali ko‘rsatadi', async () => {
    updateIntegrationSettingsMock.mockRejectedValue(new Error('secret error'))
    renderSettings()

    save()

    expect(
      await screen.findByText(
        'Yo‘lak va kamera himoyasi sozlamalarini saqlab bo‘lmadi',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('secret error')).not.toBeInTheDocument()
  })
})
