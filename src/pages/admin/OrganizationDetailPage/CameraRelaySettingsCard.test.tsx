import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import CameraRelaySettingsCard from './CameraRelaySettingsCard'
import type { UserRole } from '@/types/auth'
import type { CameraRelaySettings } from '@/types/organization'

const {
  getCameraRelaySettingsMock,
  updateCameraRelaySettingsMock,
  useAppSelectorMock,
} = vi.hoisted(() => ({
  getCameraRelaySettingsMock: vi.fn(),
  updateCameraRelaySettingsMock: vi.fn(),
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getCameraRelaySettings: getCameraRelaySettingsMock,
  updateCameraRelaySettings: updateCameraRelaySettingsMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

interface TestQueries {
  getAllByText: (text: string | RegExp) => HTMLElement[]
  getByLabelText: (text: string | RegExp) => HTMLElement
  getByRole: (
    role: string,
    options?: { name?: string | RegExp },
  ) => HTMLElement
  getByTestId: (id: string) => HTMLElement
  getByText: (text: string | RegExp) => HTMLElement
  queryByText: (text: string | RegExp) => HTMLElement | null
}

const page = screen as unknown as TestQueries
const scope = within as unknown as (element: HTMLElement) => TestQueries

const configuredDirection = {
  configured: true,
  host: '192.168.1.10',
  port: 80,
  username: 'admin',
  channel: 1,
}

const unconfiguredDirection = {
  configured: false,
  host: null,
  port: 80,
  username: null,
  channel: 1,
}

const settings: CameraRelaySettings = {
  entry: configuredDirection,
  exit: unconfiguredDirection,
}

let currentRole: UserRole = 'owner'

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
        <CameraRelaySettingsCard orgId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

async function waitForEntryForm(): Promise<HTMLElement> {
  await waitFor(() => {
    const form = page.getByTestId('camera-relay-entry-form')
    expect(form).toBeInTheDocument()
  })
  return page.getByTestId('camera-relay-entry-form')
}

function openEdit(form: HTMLElement): void {
  fireEvent.click(scope(form).getByRole('button', { name: /Tahrirlash/ }))
}

async function waitForExitForm(): Promise<HTMLElement> {
  await waitFor(() => {
    expect(page.getByTestId('camera-relay-exit-form')).toBeInTheDocument()
  })
  return page.getByTestId('camera-relay-exit-form')
}

function saveButton(form: HTMLElement): HTMLButtonElement {
  return scope(form).getByRole('button', {
    name: 'Saqlash',
  }) as HTMLButtonElement
}

describe('CameraRelaySettingsCard', () => {
  beforeEach(() => {
    currentRole = 'owner'
    useAppSelectorMock.mockReset()
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ auth: { user: { role: currentRole, org_id: 7 } } }),
    )
    getCameraRelaySettingsMock.mockReset()
    getCameraRelaySettingsMock.mockResolvedValue(settings)
    updateCameraRelaySettingsMock.mockReset()
    updateCameraRelaySettingsMock.mockResolvedValue(settings)
  })

  it('GET chaqirib configured holatlarini to‘g‘ri ko‘rsatadi', async () => {
    renderCard()

    await waitForEntryForm()
    expect(getCameraRelaySettingsMock).toHaveBeenCalledWith(7)
    expect(page.getByText('Sozlangan')).toBeInTheDocument()
    expect(page.getByText('Sozlanmagan')).toBeInTheDocument()
  })

  it('host yoki username bo‘sh bo‘lsa Saqlash disabled bo‘ladi', async () => {
    renderCard()

    const exitForm = await waitForExitForm()
    openEdit(exitForm)
    const queries = scope(exitForm)
    const password = queries.getByLabelText('Parol')
    fireEvent.change(password, { target: { value: 'secret' } })

    expect(saveButton(exitForm)).toBeDisabled()
  })

  it('configured=false holatda parol majburiy bo‘ladi', async () => {
    getCameraRelaySettingsMock.mockResolvedValue({
      ...settings,
      exit: {
        ...unconfiguredDirection,
        host: '192.168.1.20',
        username: 'operator',
      },
    })
    renderCard()

    const exitForm = await waitForExitForm()
    openEdit(exitForm)
    const queries = scope(exitForm)
    const password = queries.getByLabelText('Parol')
    expect(saveButton(exitForm)).toBeDisabled()

    fireEvent.change(password, { target: { value: 'new-secret' } })

    await waitFor(() => expect(saveButton(exitForm)).toBeEnabled())
  })

  it('configured=true holatda bo‘sh parol bilan saqlaydi va password yubormaydi', async () => {
    renderCard()

    const entryForm = await waitForEntryForm()
    openEdit(entryForm)
    const button = saveButton(entryForm)
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)

    await waitFor(() =>
      expect(updateCameraRelaySettingsMock).toHaveBeenCalledWith({
        orgId: 7,
        entry: {
          host: '192.168.1.10',
          port: 80,
          username: 'admin',
          channel: 1,
        },
      }),
    )
  })

  it('PATCH muvaffaqiyatidan keyin formani yangilab success xabarini ko‘rsatadi', async () => {
    const initialSettings: CameraRelaySettings = {
      entry: {
        ...unconfiguredDirection,
        host: '192.168.1.10',
        username: 'admin',
      },
      exit: unconfiguredDirection,
    }
    const savedSettings: CameraRelaySettings = {
      ...initialSettings,
      entry: configuredDirection,
    }
    getCameraRelaySettingsMock
      .mockResolvedValueOnce(initialSettings)
      .mockResolvedValue(savedSettings)
    updateCameraRelaySettingsMock.mockResolvedValue(savedSettings)
    renderCard()

    const entryForm = await waitForEntryForm()
    openEdit(entryForm)
    const password = scope(entryForm).getByLabelText('Parol')
    fireEvent.change(password, { target: { value: 'new-secret' } })
    const button = saveButton(entryForm)
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)

    await waitFor(() => {
      expect(page.getAllByText('Sozlangan')).toHaveLength(1)
    })
    expect(
      page.getByText('Kirish kamerasi relay sozlamalari saqlandi'),
    ).toBeInTheDocument()
  })

  it('PATCH backend xatosini aniq ko‘rsatadi', async () => {
    updateCameraRelaySettingsMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Relay host manzili noto‘g‘ri' },
      },
    })
    renderCard()

    const entryForm = await waitForEntryForm()
    openEdit(entryForm)
    const button = saveButton(entryForm)
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)

    await waitFor(() => {
      expect(page.getByText('Relay host manzili noto‘g‘ri')).toBeInTheDocument()
    })
  })

  it('operator uchun bo‘limni yashiradi va GET yubormaydi', () => {
    currentRole = 'operator'
    renderCard()

    expect(page.queryByText('Kamera relay sozlamalari')).not.toBeInTheDocument()
    expect(getCameraRelaySettingsMock).not.toHaveBeenCalled()
  })

  it('boshlangʻich holatda koʻrish rejimi, Tahrirlash bosilganda forma ochiladi', async () => {
    renderCard()

    const entryForm = await waitForEntryForm()
    const queries = scope(entryForm)

    expect(queries.getByText('192.168.1.10')).toBeInTheDocument()
    expect(queries.getByText('admin')).toBeInTheDocument()
    expect(entryForm.querySelector('input')).toBeNull()

    openEdit(entryForm)

    expect(queries.getByLabelText('IP/Host manzili')).toHaveValue('192.168.1.10')
    expect(queries.getByLabelText('Foydalanuvchi nomi')).toHaveValue('admin')
    expect(saveButton(entryForm)).toBeInTheDocument()
    expect(
      queries.getByRole('button', { name: 'Bekor qilish' }),
    ).toBeInTheDocument()
  })

  it('Saqlashdan keyin koʻrish rejimiga qaytadi va yangi qiymat koʻrinadi', async () => {
    const savedSettings: CameraRelaySettings = {
      ...settings,
      entry: { ...configuredDirection, host: '10.0.0.5' },
    }
    getCameraRelaySettingsMock
      .mockResolvedValueOnce(settings)
      .mockResolvedValue(savedSettings)
    updateCameraRelaySettingsMock.mockResolvedValue(savedSettings)
    renderCard()

    const entryForm = await waitForEntryForm()
    openEdit(entryForm)
    fireEvent.change(scope(entryForm).getByLabelText('IP/Host manzili'), {
      target: { value: '10.0.0.5' },
    })
    const button = saveButton(entryForm)
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)

    await waitFor(() =>
      expect(scope(entryForm).getByText('10.0.0.5')).toBeInTheDocument(),
    )
    expect(entryForm.querySelector('input')).toBeNull()
    expect(
      scope(entryForm).getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()
  })

  it('Bekor qilish oʻzgarishlarni saqlamasdan koʻrish rejimiga qaytaradi', async () => {
    renderCard()

    const entryForm = await waitForEntryForm()
    openEdit(entryForm)
    fireEvent.change(scope(entryForm).getByLabelText('IP/Host manzili'), {
      target: { value: '10.0.0.9' },
    })
    fireEvent.click(
      scope(entryForm).getByRole('button', { name: 'Bekor qilish' }),
    )

    expect(entryForm.querySelector('input')).toBeNull()
    expect(scope(entryForm).getByText('192.168.1.10')).toBeInTheDocument()
    expect(scope(entryForm).queryByText('10.0.0.9')).not.toBeInTheDocument()
    expect(updateCameraRelaySettingsMock).not.toHaveBeenCalled()
  })

  it('Entry va Exit formalari mustaqil tahrirlanadi', async () => {
    renderCard()

    const entryForm = await waitForEntryForm()
    const exitForm = await waitForExitForm()

    openEdit(entryForm)

    expect(entryForm.querySelector('input')).not.toBeNull()
    expect(exitForm.querySelector('input')).toBeNull()
    expect(
      scope(exitForm).getByRole('button', { name: /Tahrirlash/ }),
    ).toBeInTheDocument()

    openEdit(exitForm)

    expect(exitForm.querySelector('input')).not.toBeNull()
    expect(entryForm.querySelector('input')).not.toBeNull()

    fireEvent.click(
      scope(entryForm).getByRole('button', { name: 'Bekor qilish' }),
    )

    expect(entryForm.querySelector('input')).toBeNull()
    expect(exitForm.querySelector('input')).not.toBeNull()
  })

  it('koʻrish rejimida parol ochiq koʻrsatilmaydi', async () => {
    renderCard()

    const entryForm = await waitForEntryForm()
    const exitForm = await waitForExitForm()

    expect(scope(entryForm).getByText("O'rnatilgan")).toBeInTheDocument()
    expect(scope(exitForm).getByText("O'rnatilmagan")).toBeInTheDocument()
    expect(
      entryForm.querySelector('input[type="password"]'),
    ).toBeNull()

    openEdit(entryForm)

    expect(scope(entryForm).getByLabelText('Parol')).toHaveValue('')
  })
})
