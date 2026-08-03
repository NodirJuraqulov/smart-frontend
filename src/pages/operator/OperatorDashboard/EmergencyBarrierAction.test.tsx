import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import EmergencyBarrierAction from './EmergencyBarrierAction'
import type { EmergencyBarrierOpenResponse } from '@/types/organization'

const {
  getCameraRelaySettingsMock,
  getOrganizationGateLayoutMock,
  openEmergencyBarrierMock,
} = vi.hoisted(() => ({
  getCameraRelaySettingsMock: vi.fn(),
  getOrganizationGateLayoutMock: vi.fn(),
  openEmergencyBarrierMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getCameraRelaySettings: getCameraRelaySettingsMock,
  getOrganizationGateLayout: getOrganizationGateLayoutMock,
  openEmergencyBarrier: openEmergencyBarrierMock,
}))

vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal<typeof import('antd')>()
  return {
    ...antd,
    Modal: ({
      open,
      title,
      footer,
      children,
    }: import('antd').ModalProps) => {
      const renderedFooter = typeof footer === 'function' ? null : footer
      return open ? (
        <div role="dialog">
          <div>{title}</div>
          <div>{children}</div>
          <div>{renderedFooter}</div>
        </div>
      ) : null
    },
  }
})

function renderAction() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EmergencyBarrierAction orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

async function openModal() {
  const button = screen.getByRole('button', { name: /Shlagbaumni ochish/ })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
  return screen.findByRole('dialog')
}

const gateLayout = {
  gate_layout: 'separate' as const,
}

const relaySettings = {
  entry: {
    configured: true,
    host: '192.168.1.10',
    port: 80,
    username: 'admin',
    channel: 1,
  },
  exit: {
    configured: true,
    host: '192.168.1.11',
    port: 80,
    username: 'admin',
    channel: 1,
  },
}

describe('EmergencyBarrierAction', () => {
  beforeEach(() => {
    getOrganizationGateLayoutMock.mockReset().mockResolvedValue(gateLayout)
    getCameraRelaySettingsMock.mockReset().mockResolvedValue(relaySettings)
    openEmergencyBarrierMock.mockReset()
  })

  it('shared layoutda yo‘nalish tanlovisiz qisqa tasdiqlash modalini ko‘rsatadi', async () => {
    getOrganizationGateLayoutMock.mockResolvedValue({ gate_layout: 'shared' })
    renderAction()

    const modal = await openModal()

    expect(modal).toHaveTextContent('Shlagbaumni ochishni tasdiqlaysizmi?')
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.queryByText("Yo'nalish")).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Sabab (ixtiyoriy)'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Ha, ochish' }),
    ).toBeInTheDocument()
  })

  it('shared layoutda configured relay directionini APIga yuboradi', async () => {
    getOrganizationGateLayoutMock.mockResolvedValue({ gate_layout: 'shared' })
    getCameraRelaySettingsMock.mockResolvedValue({
      ...relaySettings,
      exit: { ...relaySettings.exit, configured: false },
    })
    openEmergencyBarrierMock.mockResolvedValue({ barrier_status: 'failed' })
    renderAction()
    await openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Ha, ochish' }))

    await waitFor(() =>
      expect(openEmergencyBarrierMock).toHaveBeenCalledWith({
        orgId: 7,
        direction: 'entry',
      }),
    )
  })

  it('separate layoutda kirish va chiqish yo‘nalishi tanlovini saqlaydi', async () => {
    renderAction()

    await openModal()

    expect(screen.getByRole('radio', { name: 'Kirish' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Chiqish' })).toBeInTheDocument()
  })

  it('shared layoutda ikkala relay configured bo‘lsa exitni yuboradi', async () => {
    getOrganizationGateLayoutMock.mockResolvedValue({ gate_layout: 'shared' })
    openEmergencyBarrierMock.mockResolvedValue({ barrier_status: 'failed' })
    renderAction()
    await openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Ha, ochish' }))

    await waitFor(() =>
      expect(openEmergencyBarrierMock).toHaveBeenCalledWith({
        orgId: 7,
        direction: 'exit',
      }),
    )
  })

  it('tugma bosilganda tasdiqlash modalini ochadi', async () => {
    renderAction()

    const modal = await openModal()

    expect(modal).toHaveTextContent('Favqulodda shlagbaumni ochish')
    expect(modal).toHaveTextContent(
      "Bu funksiya faqat favqulodda holatlar uchun. Shlagbaum hech qanday sessiya yoki to'lovga bog'lanmasdan ochiladi.",
    )
  })

  it('direction va reason bilan organization API funksiyasini chaqiradi', async () => {
    openEmergencyBarrierMock.mockResolvedValue({ barrier_status: 'failed' })
    renderAction()
    await openModal()
    fireEvent.click(screen.getByRole('radio', { name: 'Chiqish' }))
    fireEvent.change(screen.getByPlaceholderText('Sabab (ixtiyoriy)'), {
      target: { value: '  Elektr uzildi  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ochish' }))

    await waitFor(() =>
      expect(openEmergencyBarrierMock).toHaveBeenCalledWith({
        orgId: 7,
        direction: 'exit',
        reason: 'Elektr uzildi',
      }),
    )
  })

  it('opened holatida muvaffaqiyat xabarini ko‘rsatib modalni yopadi', async () => {
    openEmergencyBarrierMock.mockResolvedValue({ barrier_status: 'opened' })
    renderAction()
    await openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Ochish' }))

    expect(await screen.findByText('Shlagbaum ochildi')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('failed holatida xato xabarini ko‘rsatib modalni ochiq qoldiradi', async () => {
    openEmergencyBarrierMock.mockResolvedValue({ barrier_status: 'failed' })
    renderAction()
    await openModal()
    fireEvent.click(screen.getByRole('button', { name: 'Ochish' }))

    expect(
      await screen.findByText("Shlagbaum ochilmadi, qayta urinib ko'ring"),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('disabled va not_configured holatlarida aniq xabar bilan modalni yopadi', async () => {
    openEmergencyBarrierMock
      .mockResolvedValueOnce({ barrier_status: 'disabled' })
      .mockResolvedValueOnce({ barrier_status: 'not_configured' })
    renderAction()

    for (let index = 0; index < 2; index += 1) {
      await openModal()
      fireEvent.click(screen.getByRole('button', { name: 'Ochish' }))
      expect(
        await screen.findByText(
          "Shlagbaum konfiguratsiya qilinmagan, administrator bilan bog'laning",
        ),
      ).toBeInTheDocument()
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      )
    }

    expect(openEmergencyBarrierMock).toHaveBeenCalledTimes(2)
  })

  it('so‘rov davomida tasdiqlash tugmasini bloklab double-submitni to‘xtatadi', async () => {
    let resolveRequest!: (value: EmergencyBarrierOpenResponse) => void
    openEmergencyBarrierMock.mockReturnValue(
      new Promise<EmergencyBarrierOpenResponse>((resolve) => {
        resolveRequest = resolve
      }),
    )
    renderAction()
    await openModal()
    const confirmButton = screen.getByRole('button', { name: 'Ochish' })
    fireEvent.click(confirmButton)

    await waitFor(() => expect(confirmButton).toBeDisabled())
    fireEvent.click(confirmButton)
    expect(openEmergencyBarrierMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveRequest({ barrier_status: 'opened' })
    })
  })
})
