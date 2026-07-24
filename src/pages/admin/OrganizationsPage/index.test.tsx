import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { App as AntdApp } from 'antd'
import { ThemeProvider } from '@/contexts/ThemeContext'
import OrganizationsPage from './index'

const { getOrganizationsMock, createOrganizationMock, toggleOrgBlockMock } =
  vi.hoisted(() => ({
    getOrganizationsMock: vi.fn(),
    createOrganizationMock: vi.fn(),
    toggleOrgBlockMock: vi.fn(),
  }))

vi.mock('@/api/organizations', () => ({
  getOrganizations: getOrganizationsMock,
  createOrganization: createOrganizationMock,
  updateOrganization: vi.fn(),
  toggleOrgBlock: toggleOrgBlockMock,
}))

function renderPage() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdApp>
          <MemoryRouter>
            <OrganizationsPage />
          </MemoryRouter>
        </AntdApp>
      </ThemeProvider>
    </QueryClientProvider>,
  )
}

async function openCreateModal() {
  fireEvent.click(
    await screen.findByRole('button', { name: /Yangi stoyanka/ }),
  )
}

describe('OrganizationsPage create organization form', () => {
  beforeEach(() => {
    getOrganizationsMock.mockReset().mockResolvedValue([])
    createOrganizationMock.mockReset()
    toggleOrgBlockMock.mockReset()
  })

  it("Operator qo'shish belgilanmasa payload'da operator: undefined ketadi (regression)", async () => {
    createOrganizationMock.mockResolvedValue({
      organization: { id: 1 },
      operator: { id: 1 },
    })
    renderPage()
    await openCreateModal()

    fireEvent.change(screen.getByPlaceholderText('Masalan: Yunusobod AutoPark'), {
      target: { value: 'Chorsu' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Ism familiya')[0], {
      target: { value: 'Aziz Egamov' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Login')[0], {
      target: { value: 'aziz123' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Parol')[0], {
      target: { value: 'password1' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masalan: 5000'), {
      target: { value: '5000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(createOrganizationMock).toHaveBeenCalled())
    expect(createOrganizationMock).toHaveBeenCalledWith({
      name: 'Chorsu',
      address: undefined,
      owner: { name: 'Aziz Egamov', login: 'aziz123', password: 'password1' },
      operator: undefined,
      tariff: { price_per_hour: 5000, grace_period_minutes: undefined },
    })
  })

  it("'Operator qo'shish' belgilansa operator maydonlari korinadi va payload'ga qoshiladi (regression)", async () => {
    createOrganizationMock.mockResolvedValue({
      organization: { id: 1 },
      operator: { id: 1 },
    })
    renderPage()
    await openCreateModal()

    fireEvent.change(screen.getByPlaceholderText('Masalan: Yunusobod AutoPark'), {
      target: { value: 'Chorsu' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Ism familiya')[0], {
      target: { value: 'Aziz Egamov' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Login')[0], {
      target: { value: 'aziz123' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Parol')[0], {
      target: { value: 'password1' },
    })

    fireEvent.click(screen.getByRole('checkbox', { name: /Operator qo'shish/ }))

    await waitFor(() =>
      expect(screen.getAllByPlaceholderText('Ism familiya')).toHaveLength(2),
    )
    fireEvent.change(screen.getAllByPlaceholderText('Ism familiya')[1], {
      target: { value: 'Bekzod Yusupov' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Login')[1], {
      target: { value: 'bekzod1' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Parol')[1], {
      target: { value: 'password2' },
    })

    fireEvent.change(screen.getByPlaceholderText('Masalan: 5000'), {
      target: { value: '5000' },
    })
    fireEvent.change(screen.getByPlaceholderText('Masalan: 15'), {
      target: { value: '15' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Yaratish' }))

    await waitFor(() => expect(createOrganizationMock).toHaveBeenCalled())
    expect(createOrganizationMock).toHaveBeenCalledWith({
      name: 'Chorsu',
      address: undefined,
      owner: { name: 'Aziz Egamov', login: 'aziz123', password: 'password1' },
      operator: {
        name: 'Bekzod Yusupov',
        login: 'bekzod1',
        password: 'password2',
      },
      tariff: { price_per_hour: 5000, grace_period_minutes: 15 },
    })
  })
})
