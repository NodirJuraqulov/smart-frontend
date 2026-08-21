import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import LedSettingsCard from './LedSettingsCard'
import type { LedSettings } from '@/types/organization'

const { getLedSettingsMock, updateLedSettingsMock } = vi.hoisted(() => ({
  getLedSettingsMock: vi.fn(),
  updateLedSettingsMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getLedSettings: getLedSettingsMock,
  updateLedSettings: updateLedSettingsMock,
}))

const configuredSettings: LedSettings = {
  led_host: '192.168.1.157',
  led_port: 10000,
}

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <LedSettingsCard orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('LedSettingsCard', () => {
  beforeEach(() => {
    getLedSettingsMock.mockReset().mockResolvedValue(configuredSettings)
    updateLedSettingsMock.mockReset().mockResolvedValue(configuredSettings)
  })

  it('mavjud LED host va portini ko‘rish rejimida ko‘rsatadi', async () => {
    renderCard()

    expect(await screen.findByText('192.168.1.157')).toBeInTheDocument()
    expect(screen.getByText('10000')).toBeInTheDocument()
    expect(screen.getByText('Sozlangan')).toBeInTheDocument()
    expect(getLedSettingsMock).toHaveBeenCalledWith(7)
  })

  it('led_host null bo‘lsa Sozlanmagan holatini ko‘rsatadi', async () => {
    getLedSettingsMock.mockResolvedValue({ led_host: null, led_port: null })

    renderCard()

    expect(await screen.findAllByText('Sozlanmagan')).toHaveLength(2)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('Tahrirlash bosilganda host va port formasi ochiladi', async () => {
    renderCard()

    fireEvent.click(
      await screen.findByRole('button', { name: /Tahrirlash/ }),
    )

    expect(screen.getByLabelText('IP/Host manzili')).toHaveValue(
      '192.168.1.157',
    )
    expect(screen.getByLabelText('Port')).toHaveValue('10000')
    expect(screen.getByRole('button', { name: 'Saqlash' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bekor qilish' }),
    ).toBeInTheDocument()
  })

  it('Saqlash to‘g‘ri organization endpoint payloadini yuboradi', async () => {
    const savedSettings: LedSettings = {
      led_host: '10.0.0.25',
      led_port: 10001,
    }
    updateLedSettingsMock.mockResolvedValue(savedSettings)
    getLedSettingsMock
      .mockResolvedValueOnce(configuredSettings)
      .mockResolvedValue(savedSettings)
    renderCard()

    fireEvent.click(
      await screen.findByRole('button', { name: /Tahrirlash/ }),
    )
    fireEvent.change(screen.getByLabelText('IP/Host manzili'), {
      target: { value: '10.0.0.25' },
    })
    fireEvent.change(screen.getByLabelText('Port'), {
      target: { value: '10001' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() =>
      expect(updateLedSettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        led_host: '10.0.0.25',
        led_port: 10001,
      }),
    )
  })

  it('sozlanmagan LED tahrirlanganda port 10000 bilan ochiladi', async () => {
    getLedSettingsMock.mockResolvedValue({ led_host: null, led_port: null })
    renderCard()

    fireEvent.click(
      await screen.findByRole('button', { name: /Tahrirlash/ }),
    )

    expect(screen.getByLabelText('Port')).toHaveValue('10000')
  })
})
