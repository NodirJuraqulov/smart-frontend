import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import SettingsCard from './SettingsCard'
import type { OrgSettings } from '@/types/settings'

const { getSettingsMock, updateSettingsMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
  updateSettingsMock: vi.fn(),
}))

vi.mock('@/api/settings', () => ({
  getSettings: getSettingsMock,
  updateSettings: updateSettingsMock,
}))

const unrestrictedSettings: OrgSettings = {
  id: 1,
  org_id: 1,
  work_hours_enabled: false,
  work_start: null,
  work_end: null,
  created_at: '2026-07-01T00:00:00.000Z',
}

const restrictedSettings: OrgSettings = {
  ...unrestrictedSettings,
  work_hours_enabled: true,
  work_start: '09:00',
  work_end: '18:00',
}

function renderCard() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <SettingsCard orgId={1} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('SettingsCard', () => {
  beforeEach(() => {
    getSettingsMock.mockReset()
    updateSettingsMock.mockReset()
  })

  it("korish rejimida cheklanmagan holatni korsatadi", async () => {
    getSettingsMock.mockResolvedValue(unrestrictedSettings)
    renderCard()

    expect(await screen.findByText('Cheklanmagan')).toBeInTheDocument()
  })

  it("korish rejimida ish vaqti oralig'ini korsatadi", async () => {
    getSettingsMock.mockResolvedValue(restrictedSettings)
    renderCard()

    expect(await screen.findByText('09:00 – 18:00')).toBeInTheDocument()
  })

  it("Tahrirlash bosilganda mavjud qiymatlar bilan toldirilgan forma ochiladi", async () => {
    getSettingsMock.mockResolvedValue(restrictedSettings)
    renderCard()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))

    expect(screen.getByRole('switch')).toBeChecked()
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument()
    expect(screen.getByDisplayValue('18:00')).toBeInTheDocument()
  })

  it("Saqlashdan keyin Korish rejimiga qaytadi va yangi qiymatni korsatadi (regression)", async () => {
    getSettingsMock
      .mockResolvedValueOnce(unrestrictedSettings)
      .mockResolvedValue(restrictedSettings)
    updateSettingsMock.mockResolvedValue(restrictedSettings)
    renderCard()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateSettingsMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Tahrirlash/ })).toBeInTheDocument(),
    )
    expect(screen.queryByRole('button', { name: 'Saqlash' })).not.toBeInTheDocument()
    expect(await screen.findByText('09:00 – 18:00')).toBeInTheDocument()
  })

  it("Bekor qilish saqlashsiz korish rejimiga qaytaradi", async () => {
    getSettingsMock.mockResolvedValue(unrestrictedSettings)
    renderCard()

    fireEvent.click(await screen.findByRole('button', { name: /Tahrirlash/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    expect(updateSettingsMock).not.toHaveBeenCalled()
    expect(await screen.findByText('Cheklanmagan')).toBeInTheDocument()
  })
})
