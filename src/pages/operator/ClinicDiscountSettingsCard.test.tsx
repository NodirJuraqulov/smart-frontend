import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ClinicDiscountSettingsCard from './ClinicDiscountSettingsCard'

const { getClinicDiscountSettingsMock, updateClinicDiscountSettingsMock } =
  vi.hoisted(() => ({
    getClinicDiscountSettingsMock: vi.fn(),
    updateClinicDiscountSettingsMock: vi.fn(),
  }))

vi.mock('@/api/clinicDiscounts', () => ({
  getClinicDiscountSettings: getClinicDiscountSettingsMock,
  updateClinicDiscountSettings: updateClinicDiscountSettingsMock,
}))

function renderCard() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ClinicDiscountSettingsCard orgId={1} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('ClinicDiscountSettingsCard', () => {
  beforeEach(() => {
    getClinicDiscountSettingsMock.mockReset()
    updateClinicDiscountSettingsMock.mockReset()
  })

  it("chegirma foizini yuklaydi va saqlaydi", async () => {
    getClinicDiscountSettingsMock.mockResolvedValue({
      clinic_discount_percent: 10,
    })
    updateClinicDiscountSettingsMock.mockResolvedValue({
      clinic_discount_percent: 25,
    })

    renderCard()

    const input = await screen.findByRole('spinbutton')
    await waitFor(() => expect(input).toHaveValue('10'))

    fireEvent.change(input, { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() =>
      expect(updateClinicDiscountSettingsMock).toHaveBeenCalledWith({
        orgId: 1,
        clinic_discount_percent: 25,
      }),
    )
    expect(await screen.findByText('Sozlamalar saqlandi')).toBeInTheDocument()
  })

  it("0-100 oraligidan tashqari qiymatni qabul qilmaydi (100 gacha cheklaydi)", async () => {
    getClinicDiscountSettingsMock.mockResolvedValue({
      clinic_discount_percent: 10,
    })
    updateClinicDiscountSettingsMock.mockResolvedValue({
      clinic_discount_percent: 100,
    })

    renderCard()

    const input = await screen.findByRole('spinbutton')
    fireEvent.change(input, { target: { value: '150' } })
    fireEvent.blur(input)
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() => expect(updateClinicDiscountSettingsMock).toHaveBeenCalled())
    const [payload] = updateClinicDiscountSettingsMock.mock.calls[0]
    expect(payload.clinic_discount_percent).toBeLessThanOrEqual(100)
  })
})
