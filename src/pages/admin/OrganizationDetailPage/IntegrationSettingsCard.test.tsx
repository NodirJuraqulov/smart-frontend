import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import IntegrationSettingsCard from './IntegrationSettingsCard'
import type { IntegrationSettings } from '@/types/organization'

const {
  getIntegrationSettingsMock,
  updateIntegrationSettingsMock,
  regenerateWebhookTokenMock,
  testRelayMock,
  testPrinterMock,
  copyToClipboardMock,
} = vi.hoisted(() => ({
  getIntegrationSettingsMock: vi.fn(),
  updateIntegrationSettingsMock: vi.fn(),
  regenerateWebhookTokenMock: vi.fn(),
  testRelayMock: vi.fn(),
  testPrinterMock: vi.fn(),
  copyToClipboardMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getIntegrationSettings: getIntegrationSettingsMock,
  updateIntegrationSettings: updateIntegrationSettingsMock,
  regenerateWebhookToken: regenerateWebhookTokenMock,
  testRelay: testRelayMock,
  testPrinter: testPrinterMock,
}))

vi.mock('@/utils/clipboard', () => ({
  copyToClipboard: copyToClipboardMock,
}))

const settings: IntegrationSettings = {
  relay_entry_ip: '192.168.1.10',
  relay_exit_ip: null,
  printer_ip: '192.168.1.20',
  camera_brand: 'hikvision',
  webhook_token: 'token-123',
  webhook_entry_url: 'https://example.com/api/webhook/hikvision/token-123/entry',
  webhook_exit_url: 'https://example.com/api/webhook/hikvision/token-123/exit',
  webhook_debug_entry_url: 'https://example.com/api/webhook/debug/token-123/entry',
  webhook_debug_exit_url: 'https://example.com/api/webhook/debug/token-123/exit',
  last_webhook_entry_at: null,
  last_webhook_exit_at: null,
  gate_layout: 'separate',
  cross_camera_guard_seconds: 90,
}

function renderCard() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <IntegrationSettingsCard orgId={1} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('IntegrationSettingsCard', () => {
  beforeEach(() => {
    getIntegrationSettingsMock.mockReset().mockResolvedValue(settings)
    updateIntegrationSettingsMock.mockReset()
    regenerateWebhookTokenMock.mockReset()
    testRelayMock.mockReset()
    testPrinterMock.mockReset()
    copyToClipboardMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('webhook manzillarini korsatadi', async () => {
    renderCard()

    expect(
      await screen.findByText(settings.webhook_entry_url!),
    ).toBeInTheDocument()
    expect(screen.getByText(settings.webhook_exit_url!)).toBeInTheDocument()
  })

  it('nusxalash tugmasi togri URL bilan chaqiriladi (regression)', async () => {
    copyToClipboardMock.mockResolvedValue(true)
    renderCard()

    await screen.findByText(settings.webhook_entry_url!)
    const copyButtons = screen.getAllByRole('button', { name: /Nusxalash/ })
    fireEvent.click(copyButtons[0])

    await waitFor(() =>
      expect(copyToClipboardMock).toHaveBeenCalledWith(
        settings.webhook_entry_url,
      ),
    )
  })

  it('debug webhook manzillarini korsatadi', async () => {
    renderCard()

    expect(
      await screen.findByText(settings.webhook_debug_entry_url!),
    ).toBeInTheDocument()
    expect(
      screen.getByText(settings.webhook_debug_exit_url!),
    ).toBeInTheDocument()
  })

  it('debug URL nusxalash tugmasi togri manzil bilan chaqiriladi (regression)', async () => {
    copyToClipboardMock.mockResolvedValue(true)
    renderCard()

    await screen.findByText(settings.webhook_debug_entry_url!)
    const copyButtons = screen.getAllByRole('button', { name: /Nusxalash/ })
    fireEvent.click(copyButtons[2])

    await waitFor(() =>
      expect(copyToClipboardMock).toHaveBeenCalledWith(
        settings.webhook_debug_entry_url,
      ),
    )
  })

  it("tokenni yangilash tasdiqlangandan keyin togri org id bilan yuboradi (regression)", async () => {
    regenerateWebhookTokenMock.mockResolvedValue('new-token')
    renderCard()

    fireEvent.click(
      await screen.findByRole('button', { name: /Tokenni yangilash/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ha, yangilash' }))

    await waitFor(() =>
      expect(regenerateWebhookTokenMock).toHaveBeenCalledWith(1),
    )
  })

  it("rele IP sozlangan bolsa Sinash tugmasi korinadi va togri yonalish bilan chaqiriladi (regression)", async () => {
    testRelayMock.mockResolvedValue(true)
    renderCard()

    const testButtons = await screen.findAllByRole('button', { name: /Sinash/ })
    expect(testButtons).toHaveLength(1)
    fireEvent.click(testButtons[0])

    await waitFor(() =>
      expect(testRelayMock).toHaveBeenCalledWith({ orgId: 1, direction: 'entry' }),
    )
  })

  it("sozlanmagan rele IP uchun 'Sozlanmagan' korsatadi va Sinash tugmasi bolmaydi", async () => {
    renderCard()

    await screen.findByText(settings.webhook_entry_url!)
    expect(screen.getByText('Sozlanmagan')).toBeInTheDocument()
  })

  it("Tahrirlash mavjud qiymatlarni inputlarga toldiradi va Saqlash togri payload yuboradi (regression)", async () => {
    updateIntegrationSettingsMock.mockResolvedValue({
      ...settings,
      relay_exit_ip: '192.168.1.30',
    })
    renderCard()

    fireEvent.click(
      (await screen.findAllByRole('button', { name: /Tahrirlash/ })).at(-1)!,
    )

    expect(screen.getByDisplayValue('192.168.1.10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('192.168.1.20')).toBeInTheDocument()

    const inputs = screen.getAllByRole('textbox')
    fireEvent.change(inputs[1], { target: { value: '192.168.1.30' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Saqlash' }).at(-1)!)

    await waitFor(() => expect(updateIntegrationSettingsMock).toHaveBeenCalled())
    expect(updateIntegrationSettingsMock).toHaveBeenCalledWith({
      orgId: 1,
      relay_entry_ip: '192.168.1.10',
      relay_exit_ip: '192.168.1.30',
      printer_ip: '192.168.1.20',
    })
  })

  it("Bekor qilish saqlashsiz korish rejimiga qaytaradi", async () => {
    renderCard()

    fireEvent.click(
      (await screen.findAllByRole('button', { name: /Tahrirlash/ })).at(-1)!,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bekor qilish' }))

    expect(updateIntegrationSettingsMock).not.toHaveBeenCalled()
    expect(await screen.findByText('Sozlanmagan')).toBeInTheDocument()
  })

  describe('printerni sinash', () => {
    it("muvaffaqiyatli bolganda togri org id bilan chaqiradi va xabar korsatadi (regression)", async () => {
      testPrinterMock.mockResolvedValue({ success: true })
      renderCard()

      fireEvent.click(
        await screen.findByRole('button', { name: /Sinov chek chiqarish/ }),
      )

      await waitFor(() => expect(testPrinterMock).toHaveBeenCalledWith(1))
      expect(
        await screen.findByText(
          "Sinov cheki chiqarildi, printerni tekshiring",
        ),
      ).toBeInTheDocument()
    })

    it("printer sozlanmagan bolsa ogohlantirish korsatadi", async () => {
      testPrinterMock.mockResolvedValue({
        success: false,
        reason: 'printer_not_configured',
      })
      renderCard()

      fireEvent.click(
        await screen.findByRole('button', { name: /Sinov chek chiqarish/ }),
      )

      expect(
        await screen.findByText(
          "Avval Printer IP manzilini kiriting va saqlang",
        ),
      ).toBeInTheDocument()
    })

    it("boshqa xatoda umumiy xato xabarini korsatadi", async () => {
      testPrinterMock.mockResolvedValue({ success: false })
      renderCard()

      fireEvent.click(
        await screen.findByRole('button', { name: /Sinov chek chiqarish/ }),
      )

      expect(
        await screen.findByText(
          "Printerga ulanib bo'lmadi, IP manzilni tekshiring",
        ),
      ).toBeInTheDocument()
    })
  })

  describe('oxirgi signal', () => {
    const NOW = new Date('2026-07-26T12:00:00.000Z')

    beforeEach(() => {
      vi.setSystemTime(NOW)
    })

    it("10 daqiqadan kam bolgan signalni oddiy rangda korsatadi", async () => {
      getIntegrationSettingsMock.mockResolvedValue({
        ...settings,
        last_webhook_entry_at: new Date(
          NOW.getTime() - 5 * 60000,
        ).toISOString(),
      })
      renderCard()

      const value = await screen.findByText('5 daqiqa oldin')
      expect(value.className).not.toContain('ant-typography-warning')
    })

    it("10 daqiqadan kop bolgan signalni ogohlantirish rangida korsatadi (regression)", async () => {
      getIntegrationSettingsMock.mockResolvedValue({
        ...settings,
        last_webhook_exit_at: new Date(
          NOW.getTime() - 15 * 60000,
        ).toISOString(),
      })
      renderCard()

      const value = await screen.findByText('15 daqiqa oldin')
      expect(value.className).toContain('ant-typography-warning')
    })

    it("signal umuman kelmagan bolsa mos matn va ogohlantirish rangini korsatadi", async () => {
      getIntegrationSettingsMock.mockResolvedValue({
        ...settings,
        last_webhook_entry_at: null,
        last_webhook_exit_at: null,
      })
      renderCard()

      const values = await screen.findAllByText('Hali signal kelmagan')
      expect(values).toHaveLength(2)
      values.forEach((value) =>
        expect(value.className).toContain('ant-typography-warning'),
      )
    })
  })
})
