import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import PlateFormatsPage from './index'
import type { PlateFormat } from '@/types/plateFormat'

const {
  getOrganizationsMock,
  getPlateFormatsMock,
  createPlateFormatMock,
  updatePlateFormatMock,
  deletePlateFormatMock,
  getSettingMock,
  updateSettingMock,
} = vi.hoisted(() => ({
  getOrganizationsMock: vi.fn(),
  getPlateFormatsMock: vi.fn(),
  createPlateFormatMock: vi.fn(),
  updatePlateFormatMock: vi.fn(),
  deletePlateFormatMock: vi.fn(),
  getSettingMock: vi.fn(),
  updateSettingMock: vi.fn(),
}))

vi.mock('@/api/organizations', () => ({
  getOrganizations: getOrganizationsMock,
}))

vi.mock('@/api/plateFormats', () => ({
  getPlateFormats: getPlateFormatsMock,
  createPlateFormat: createPlateFormatMock,
  updatePlateFormat: updatePlateFormatMock,
  deletePlateFormat: deletePlateFormatMock,
  getPlateFormatValidationSetting: getSettingMock,
  updatePlateFormatValidationSetting: updateSettingMock,
}))

const formats: PlateFormat[] = [
  {
    id: 1,
    org_id: 3,
    pattern: 'NNLNNNLL',
    description: 'Oddiy avtomobil',
    is_active: true,
    created_at: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 2,
    org_id: 3,
    pattern: 'NNLLLNNN',
    description: null,
    is_active: false,
    created_at: '2026-08-02T08:00:00.000Z',
  },
]

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <PlateFormatsPage />
        </AntdApp>
      </QueryClientProvider>
    </ThemeProvider>,
  )
}

function settingSwitch(): HTMLElement {
  return screen.getAllByRole('switch')[0]
}

function rowByPattern(pattern: string): HTMLElement {
  const cell = screen.getByText(pattern)
  const row = cell.closest('tr')
  if (!row) throw new Error(`Row not found: ${pattern}`)
  return row
}

describe('PlateFormatsPage', () => {
  beforeEach(() => {
    getOrganizationsMock.mockReset().mockResolvedValue([
      { id: 3, name: 'Chorsu' },
      { id: 4, name: 'Yunusobod' },
    ])
    getPlateFormatsMock.mockReset().mockResolvedValue(formats)
    getSettingMock.mockReset().mockResolvedValue({ enabled: true })
    createPlateFormatMock.mockReset().mockResolvedValue(formats[0])
    updatePlateFormatMock.mockReset().mockResolvedValue(formats[0])
    deletePlateFormatMock.mockReset().mockResolvedValue(undefined)
    updateSettingMock.mockReset().mockResolvedValue({ enabled: false })
  })

  it('toggle holati serverdan toʻgʻri koʻrsatiladi', async () => {
    renderPage()

    await waitFor(() => expect(getSettingMock).toHaveBeenCalledWith(3))
    await waitFor(() => expect(settingSwitch()).toBeChecked())
    expect(screen.getByText('Raqam format tekshiruvi')).toBeInTheDocument()
  })

  it('toggle oʻzgartirilganda PATCH chaqiriladi', async () => {
    renderPage()
    await waitFor(() => expect(settingSwitch()).toBeChecked())

    fireEvent.click(settingSwitch())

    await waitFor(() =>
      expect(updateSettingMock).toHaveBeenCalledWith({
        orgId: 3,
        enabled: false,
      }),
    )
    await waitFor(() => expect(settingSwitch()).not.toBeChecked())
  })

  it('formatlar jadvali toʻgʻri koʻrsatiladi', async () => {
    renderPage()

    await waitFor(() => expect(getPlateFormatsMock).toHaveBeenCalledWith(3))

    const activeRow = rowByPattern('NNLNNNLL')
    expect(within(activeRow).getByText('Oddiy avtomobil')).toBeInTheDocument()
    expect(within(activeRow).getByText('Aktiv')).toBeInTheDocument()

    const inactiveRow = rowByPattern('NNLLLNNN')
    expect(within(inactiveRow).getByText('—')).toBeInTheDocument()
    expect(within(inactiveRow).getByText('Nofaol')).toBeInTheDocument()
  })

  it('yangi format qoʻshishda toʻgʻri POST body yuboriladi', async () => {
    renderPage()
    await waitFor(() => expect(getPlateFormatsMock).toHaveBeenCalledWith(3))

    fireEvent.click(
      screen.getByRole('button', { name: /Yangi format qo/ }),
    )

    fireEvent.change(document.querySelector('#pattern') as HTMLElement, {
      target: { value: 'nnlnnnll' },
    })
    fireEvent.change(document.querySelector('#description') as HTMLElement, {
      target: { value: '  Yangi tavsif  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() =>
      expect(createPlateFormatMock).toHaveBeenCalledWith({
        orgId: 3,
        pattern: 'NNLNNNLL',
        description: 'Yangi tavsif',
      }),
    )
  })

  it('format aktiv/nofaol qilinganda PATCH is_active yuboriladi', async () => {
    renderPage()
    await waitFor(() => expect(getPlateFormatsMock).toHaveBeenCalledWith(3))

    const row = rowByPattern('NNLNNNLL')
    fireEvent.click(within(row).getByRole('switch'))

    await waitFor(() =>
      expect(updatePlateFormatMock).toHaveBeenCalledWith({
        orgId: 3,
        formatId: 1,
        is_active: false,
      }),
    )
  })

  it('format oʻchirilganda DELETE chaqiriladi', async () => {
    renderPage()
    await waitFor(() => expect(getPlateFormatsMock).toHaveBeenCalledWith(3))

    const row = rowByPattern('NNLNNNLL')
    fireEvent.click(within(row).getByRole('button', { name: /O.chirish/ }))

    const confirmButton = await waitFor(() => {
      const button = document.querySelector(
        '.ant-popconfirm-buttons button.ant-btn-primary',
      )
      if (!button) throw new Error('Confirm button not found')
      return button as HTMLElement
    })
    fireEvent.click(confirmButton)

    await waitFor(() =>
      expect(deletePlateFormatMock).toHaveBeenCalledWith({
        orgId: 3,
        formatId: 1,
      }),
    )
  })

  it('notoʻgʻri pattern kiritilsa POST yuborilmaydi', async () => {
    renderPage()
    await waitFor(() => expect(getPlateFormatsMock).toHaveBeenCalledWith(3))

    fireEvent.click(screen.getByRole('button', { name: /Yangi format qo/ }))
    fireEvent.change(document.querySelector('#pattern') as HTMLElement, {
      target: { value: 'NN1X' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    expect(await screen.findByText(/faqat N va L/)).toBeInTheDocument()
    expect(createPlateFormatMock).not.toHaveBeenCalled()
  })
})
