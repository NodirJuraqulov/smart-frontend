import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import CardTerminalSettingsCard from './CardTerminalSettingsCard'
import type { CardTerminalSettings } from '@/types/organization'

const { getCardTerminalSettingsMock, updateCardTerminalSettingsMock } =
  vi.hoisted(() => ({
    getCardTerminalSettingsMock: vi.fn(),
    updateCardTerminalSettingsMock: vi.fn(),
  }))

vi.mock('@/api/organizations', () => ({
  getCardTerminalSettings: getCardTerminalSettingsMock,
  updateCardTerminalSettings: updateCardTerminalSettingsMock,
}))

const settings: CardTerminalSettings = {
  card_terminal_enabled: true,
  card_terminal_ip: '192.168.1.55',
  card_terminal_port: 62801,
  card_terminal_id: 'terminal-1',
  card_terminal_merchant_id: 'merchant-1',
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
        <CardTerminalSettingsCard orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('CardTerminalSettingsCard', () => {
  beforeEach(() => {
    getCardTerminalSettingsMock.mockReset().mockResolvedValue(settings)
    updateCardTerminalSettingsMock.mockReset().mockResolvedValue(settings)
  })

  it('GET natijasini ko‘rish rejimida ko‘rsatadi', async () => {
    renderCard()

    expect(await screen.findByText('192.168.1.55')).toBeInTheDocument()
    expect(screen.getByText('62801')).toBeInTheDocument()
    expect(screen.getByText('terminal-1')).toBeInTheDocument()
    expect(screen.getByText('merchant-1')).toBeInTheDocument()
    expect(screen.getByText('Yoqilgan')).toBeInTheDocument()
    expect(getCardTerminalSettingsMock).toHaveBeenCalledWith(7)
  })

  it('PATCHga tahrirlangan qiymatlarni yuboradi', async () => {
    const saved: CardTerminalSettings = {
      ...settings,
      card_terminal_ip: '10.0.0.25',
      card_terminal_port: 62802,
      card_terminal_id: null,
    }
    updateCardTerminalSettingsMock.mockResolvedValue(saved)
    renderCard()

    fireEvent.click(
      await screen.findByRole('button', { name: /Tahrirlash/ }),
    )
    fireEvent.change(screen.getByLabelText('IP manzil'), {
      target: { value: '10.0.0.25' },
    })
    fireEvent.change(screen.getByLabelText('Port'), {
      target: { value: '62802' },
    })
    fireEvent.change(screen.getByLabelText('Terminal ID'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() =>
      expect(updateCardTerminalSettingsMock).toHaveBeenCalledWith(7, {
        card_terminal_enabled: true,
        card_terminal_ip: '10.0.0.25',
        card_terminal_port: 62802,
        card_terminal_id: null,
        card_terminal_merchant_id: 'merchant-1',
      }),
    )
  })

  it('protokolli hostni rad etadi va port chegaralarini o‘rnatadi', async () => {
    renderCard()

    fireEvent.click(
      await screen.findByRole('button', { name: /Tahrirlash/ }),
    )
    fireEvent.change(screen.getByLabelText('IP manzil'), {
      target: { value: 'http://192.168.1.55' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    expect(
      await screen.findByText("Protokolsiz to'g'ri IP manzilni kiriting"),
    ).toBeInTheDocument()
    expect(updateCardTerminalSettingsMock).not.toHaveBeenCalled()

    expect(screen.getByLabelText('Port')).toHaveAttribute('aria-valuemin', '1')
    expect(screen.getByLabelText('Port')).toHaveAttribute(
      'aria-valuemax',
      '65535',
    )
    expect(updateCardTerminalSettingsMock).not.toHaveBeenCalled()
  })

  it('GET xatosida qayta urinish imkonini ko‘rsatadi', async () => {
    getCardTerminalSettingsMock.mockRejectedValueOnce(new Error('offline'))
    renderCard()

    fireEvent.click(await screen.findByRole('button', { name: 'Qayta urinish' }))

    await waitFor(() =>
      expect(getCardTerminalSettingsMock).toHaveBeenCalledTimes(2),
    )
  })
})
