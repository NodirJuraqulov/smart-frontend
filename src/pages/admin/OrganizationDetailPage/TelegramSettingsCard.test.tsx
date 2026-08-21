import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import TelegramSettingsCard from './TelegramSettingsCard'
import type { TelegramSettings } from '@/types/organization'

const { getTelegramSettingsMock, updateTelegramSettingsMock } = vi.hoisted(
  () => ({
    getTelegramSettingsMock: vi.fn(),
    updateTelegramSettingsMock: vi.fn(),
  }),
)

vi.mock('@/api/organizations', () => ({
  getTelegramSettings: getTelegramSettingsMock,
  updateTelegramSettings: updateTelegramSettingsMock,
}))

const configuredSettings: TelegramSettings = {
  telegram_bot_configured: true,
  telegram_chat_ids: ['1652032889', '-987654321'],
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
        <TelegramSettingsCard orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

async function openEditForm() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Tahrirlash/ }),
  )
}

describe('TelegramSettingsCard', () => {
  beforeEach(() => {
    getTelegramSettingsMock.mockReset().mockResolvedValue(configuredSettings)
    updateTelegramSettingsMock
      .mockReset()
      .mockResolvedValue(configuredSettings)
  })

  it('token holati va Chat IDlarni ko‘rish rejimida ko‘rsatadi', async () => {
    renderCard()

    expect(await screen.findByText('1652032889')).toBeInTheDocument()
    expect(screen.getByText('-987654321')).toBeInTheDocument()
    expect(screen.getAllByText("O'rnatilgan")).toHaveLength(2)
    expect(getTelegramSettingsMock).toHaveBeenCalledWith(7)
  })

  it('sozlanmagan token va bo‘sh Chat ID holatini ko‘rsatadi', async () => {
    getTelegramSettingsMock.mockResolvedValue({
      telegram_bot_configured: false,
      telegram_chat_ids: [],
    })

    renderCard()

    expect(await screen.findAllByText('Sozlanmagan')).toHaveLength(3)
  })

  it('Tahrirlash mavjud Chat IDlarni alohida qatorlarda ochadi', async () => {
    renderCard()

    await openEditForm()

    const chatIdInputs = screen.getAllByRole('textbox', { name: /Chat ID/ })
    expect(chatIdInputs).toHaveLength(2)
    expect(chatIdInputs[0]).toHaveValue('1652032889')
    expect(chatIdInputs[1]).toHaveValue('-987654321')
    expect(screen.getByLabelText('Bot Token')).toHaveValue('')
  })

  it('qo‘shish tugmasi yangi Chat ID qatorini qo‘shadi', async () => {
    renderCard()
    await openEditForm()

    fireEvent.click(screen.getByRole('button', { name: 'Chat ID qo‘shish' }))

    expect(screen.getAllByRole('textbox', { name: /Chat ID/ })).toHaveLength(3)
  })

  it('o‘chirish tugmasi tanlangan Chat ID qatorini olib tashlaydi', async () => {
    renderCard()
    await openEditForm()

    fireEvent.click(screen.getByLabelText('Chat ID 1 ni o‘chirish'))

    const chatIdInputs = screen.getAllByRole('textbox', { name: /Chat ID/ })
    expect(chatIdInputs).toHaveLength(1)
    expect(chatIdInputs[0]).toHaveValue('-987654321')
  })

  it('Saqlash token va trim qilingan Chat ID massivini PATCHga yuboradi', async () => {
    renderCard()
    await openEditForm()

    fireEvent.change(screen.getByLabelText('Bot Token'), {
      target: { value: ' 123456789:TEST_bot-token ' },
    })
    const chatIdInputs = screen.getAllByRole('textbox', { name: /Chat ID/ })
    fireEvent.change(chatIdInputs[0], { target: { value: ' 777 ' } })
    fireEvent.change(chatIdInputs[1], { target: { value: ' -888 ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() =>
      expect(updateTelegramSettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        telegram_bot_token: '123456789:TEST_bot-token',
        telegram_chat_ids: ['777', '-888'],
      }),
    )
  })
})
