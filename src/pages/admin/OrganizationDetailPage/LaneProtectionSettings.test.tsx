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

function content(value: IntegrationSettings, orgId = 7) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <LaneProtectionSettings
          orgId={orgId}
          settings={value}
          queryKey={['organizations', orgId, 'integration-settings']}
        />
      </AntdApp>
    </QueryClientProvider>
  )
}

let queryClient: QueryClient

function renderSettings(value: IntegrationSettings = settings, orgId = 7) {
  queryClient = new QueryClient()
  return render(content(value, orgId))
}

function editButton() {
  return screen.getByRole('button', { name: /Tahrirlash/ })
}

function saveButton() {
  return screen.getByRole('button', { name: 'Saqlash' })
}

function cancelButton() {
  return screen.getByRole('button', { name: 'Bekor qilish' })
}

function secondsInput(): HTMLInputElement {
  return screen.getByRole('spinbutton', {
    name: 'Qarama-qarshi kamera himoya vaqti',
  })
}

async function enterEditMode() {
  fireEvent.click(editButton())
  await screen.findByRole('radio', {
    name: 'Kirish va chiqish bitta umumiy yo‘lakda',
  })
}

async function changeSeconds(value: string) {
  fireEvent.change(secondsInput(), { target: { value } })
  await waitFor(() => expect(secondsInput()).toHaveValue(value))
}

describe('LaneProtectionSettings', () => {
  beforeEach(() => {
    updateIntegrationSettingsMock.mockReset()
  })

  it('view mode’da boshlanadi va saved shared layout hamda guard vaqtini ko‘rsatadi', () => {
    renderSettings()

    expect(
      screen.getByText('Kirish va chiqish bitta umumiy yo‘lakda'),
    ).toBeInTheDocument()
    expect(screen.getByText('90 soniya')).toBeInTheDocument()
    expect(editButton()).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Saqlash' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Bekor qilish' }),
    ).not.toBeInTheDocument()
  })

  it('separate view mode himoya o‘chirilganini ko‘rsatadi', () => {
    renderSettings({ ...settings, gate_layout: 'separate' })

    expect(
      screen.getByText('Kirish va chiqish alohida yo‘lakda'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Qarama-qarshi kamera himoyasi o‘chirilgan'),
    ).toBeInTheDocument()
    expect(screen.queryByText('90 soniya')).not.toBeInTheDocument()
  })

  it('Edit current saved qiymatlarni formaga yuklaydi', async () => {
    renderSettings()
    await enterEditMode()

    expect(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish bitta umumiy yo‘lakda',
      }),
    ).toBeChecked()
    expect(secondsInput()).toHaveValue('90')
    expect(cancelButton()).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
  })

  it('layout o‘zgarsa Save yoqiladi, originalga qaytsa yana o‘chadi', async () => {
    renderSettings()
    await enterEditMode()

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish alohida yo‘lakda',
      }),
    )
    await waitFor(() => expect(saveButton()).toBeEnabled())

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish bitta umumiy yo‘lakda',
      }),
    )
    await waitFor(() => expect(saveButton()).toBeDisabled())
  })

  it('guard vaqti o‘zgarsa Save yoqiladi, originalga qaytsa o‘chadi', async () => {
    renderSettings()
    await enterEditMode()

    await changeSeconds('120')
    expect(saveButton()).toBeEnabled()

    await changeSeconds('90')
    expect(saveButton()).toBeDisabled()
  })

  it('Cancel layout va guard o‘zgarishlarini tashlab view mode’ga qaytadi', async () => {
    renderSettings()
    await enterEditMode()

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish alohida yo‘lakda',
      }),
    )
    fireEvent.click(cancelButton())

    expect(
      screen.getByText('Kirish va chiqish bitta umumiy yo‘lakda'),
    ).toBeInTheDocument()
    expect(screen.getByText('90 soniya')).toBeInTheDocument()
    expect(updateIntegrationSettingsMock).not.toHaveBeenCalled()
  })

  it('Cancel qilingan guard qiymati qayta Edit ochilganda saqlanib qolmaydi', async () => {
    renderSettings()
    await enterEditMode()
    await changeSeconds('120')
    fireEvent.click(cancelButton())

    await enterEditMode()

    expect(secondsInput()).toHaveValue('90')
    expect(saveButton()).toBeDisabled()
  })

  it('separate layout guard inputni disable qiladi va valid qiymatni saqlaydi', async () => {
    renderSettings()
    await enterEditMode()

    fireEvent.click(
      screen.getByRole('radio', {
        name: 'Kirish va chiqish alohida yo‘lakda',
      }),
    )

    await waitFor(() => expect(secondsInput()).toBeDisabled())
    expect(secondsInput()).toHaveValue('90')
    expect(saveButton()).toBeEnabled()
  })

  it.each([
    ['4', 'Himoya vaqti kamida 5 soniya bo‘lishi kerak'],
    ['301', 'Himoya vaqti 300 soniyadan oshmasligi kerak'],
    ['90.5', 'Himoya vaqti butun son bo‘lishi kerak'],
  ])('%s invalid bo‘lsa localized xato chiqadi va Save o‘chadi', async (value, error) => {
    renderSettings()
    await enterEditMode()

    await changeSeconds(value)

    expect(await screen.findByText(error)).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
    expect(updateIntegrationSettingsMock).not.toHaveBeenCalled()
  })

  it('successful Save snake_case va mavjud integration maydonlarini yuborib view mode’ni yangilaydi', async () => {
    const saved = { ...settings, cross_camera_guard_seconds: 120 }
    updateIntegrationSettingsMock.mockResolvedValue(saved)
    renderSettings()
    await enterEditMode()
    await changeSeconds('120')

    fireEvent.click(saveButton())

    await waitFor(() =>
      expect(updateIntegrationSettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        relay_entry_ip: '192.168.1.10',
        relay_exit_ip: '192.168.1.11',
        printer_ip: '192.168.1.20',
        camera_brand: 'hikvision',
        gate_layout: 'shared',
        cross_camera_guard_seconds: 120,
      }),
    )
    expect(await screen.findByText('120 soniya')).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(
      await screen.findByText(
        'Yo‘lak va kamera himoyasi sozlamalari saqlandi',
      ),
    ).toBeInTheDocument()
  })

  it('failed Save edit mode va unsaved qiymatni saqlab, retryga ruxsat beradi', async () => {
    updateIntegrationSettingsMock.mockRejectedValue(new Error('secret error'))
    renderSettings()
    await enterEditMode()
    await changeSeconds('120')

    fireEvent.click(saveButton())

    expect(
      await screen.findByText(
        'Yo‘lak va kamera himoyasi sozlamalarini saqlab bo‘lmadi',
      ),
    ).toBeInTheDocument()
    expect(secondsInput()).toHaveValue('120')
    expect(saveButton()).toBeEnabled()
    expect(screen.queryByText('secret error')).not.toBeInTheDocument()
  })

  it('view mode’dagi refetch yangi backend qiymatlarini darhol ko‘rsatadi', () => {
    const { rerender } = renderSettings()

    rerender(
      content(
        {
          ...settings,
          gate_layout: 'separate',
          cross_camera_guard_seconds: 120,
        },
        7,
      ),
    )

    expect(
      screen.getByText('Kirish va chiqish alohida yo‘lakda'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Qarama-qarshi kamera himoyasi o‘chirilgan'),
    ).toBeInTheDocument()
  })

  it('edit paytidagi refetch unsaved qiymatni o‘chirmaydi, Cancel esa latest backendga qaytaradi', async () => {
    const { rerender } = renderSettings()
    await enterEditMode()
    await changeSeconds('120')

    rerender(
      content(
        {
          ...settings,
          gate_layout: 'separate',
          cross_camera_guard_seconds: 60,
        },
        7,
      ),
    )

    expect(secondsInput()).toHaveValue('120')
    fireEvent.click(cancelButton())
    expect(
      screen.getByText('Kirish va chiqish alohida yo‘lakda'),
    ).toBeInTheDocument()
  })

  it('organization ID o‘zgarsa edit mode’dan chiqib yangi org qiymatlarini ko‘rsatadi', async () => {
    const { rerender } = renderSettings()
    await enterEditMode()
    await changeSeconds('120')

    rerender(
      content(
        {
          ...settings,
          gate_layout: 'separate',
          cross_camera_guard_seconds: 60,
        },
        8,
      ),
    )

    expect(
      await screen.findByText('Kirish va chiqish alohida yo‘lakda'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    expect(updateIntegrationSettingsMock).not.toHaveBeenCalled()
  })
})
