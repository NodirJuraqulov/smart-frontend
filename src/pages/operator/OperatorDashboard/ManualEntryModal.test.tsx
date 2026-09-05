import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App as AntdApp, Form } from 'antd'
import { describe, expect, it, vi } from 'vitest'
import ManualEntryModal, {
  type ManualFormValues,
} from './ManualEntryModal'

interface HarnessProps {
  cardEnabled?: boolean
  cardWaiting?: {
    sessionId: number
    operationNumber: string
    plateNumber: string
  } | null
  cardDeclined?: boolean
  isRetryingCard?: boolean
  onSubmit?: (values: ManualFormValues) => void
  onCancel?: () => void
  onRetryCard?: () => void
  onSwitchPaymentMethod?: () => void
}

function Harness({
  cardEnabled = true,
  cardWaiting = null,
  cardDeclined = false,
  isRetryingCard = false,
  onSubmit = vi.fn(),
  onCancel = vi.fn(),
  onRetryCard = vi.fn(),
  onSwitchPaymentMethod = vi.fn(),
}: HarnessProps) {
  const [form] = Form.useForm<ManualFormValues>()
  return (
    <ManualEntryModal
      open
      isExit
      form={form}
      isPending={false}
      cardEnabled={cardEnabled}
      cardWaiting={cardWaiting}
      cardDeclined={cardDeclined}
      isRetryingCard={isRetryingCard}
      onCancel={onCancel}
      onSubmit={onSubmit}
      onRetryCard={onRetryCard}
      onSwitchPaymentMethod={onSwitchPaymentMethod}
    />
  )
}

function renderHarness(props: HarnessProps = {}) {
  render(
    <AntdApp>
      <Harness {...props} />
    </AntdApp>,
  )
}

describe('ManualEntryModal card payment', () => {
  it('terminal yoqilganda Karta tanlovini submit qiladi', async () => {
    const onSubmit = vi.fn()
    renderHarness({ onSubmit })

    expect(screen.getAllByRole('radio')).toHaveLength(3)
    fireEvent.change(screen.getByPlaceholderText('Masalan: 01A777BA'), {
      target: { value: '01A777BA' },
    })
    fireEvent.click(screen.getByRole('radio', { name: 'Karta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Saqlash' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        plate_number: '01A777BA',
        payment_method: 'card',
      }),
    )
  })

  it('terminal o‘chirilganda Karta tanlovini ko‘rsatmaydi', () => {
    renderHarness({ cardEnabled: false })

    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.queryByRole('radio', { name: 'Karta' })).not.toBeInTheDocument()
  })

  it('karta javobi kutilganda Spin ko‘rsatadi va yopishni bloklaydi', () => {
    renderHarness({
      cardWaiting: {
        sessionId: 44,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      },
    })

    expect(
      screen.getByText("Karta orqali to'lov kutilmoqda..."),
    ).toBeInTheDocument()
    expect(document.querySelector('.ant-spin')).toBeInTheDocument()
    expect(document.querySelector('.ant-modal-close')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Saqlash' }),
    ).not.toBeInTheDocument()
  })

  it('declined holatda retry va Naqd/Onlinega o‘tish amallarini ko‘rsatadi', () => {
    const onRetryCard = vi.fn()
    const onSwitchPaymentMethod = vi.fn()
    renderHarness({
      cardWaiting: {
        sessionId: 44,
        operationNumber: 'op-1',
        plateNumber: '01A777BA',
      },
      cardDeclined: true,
      onRetryCard,
      onSwitchPaymentMethod,
    })

    expect(
      screen.getByText("Karta orqali to'lov amalga oshmadi"),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Karta orqali qayta urinish' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: "Naqd/Online ga o'tish" }),
    )

    expect(onRetryCard).toHaveBeenCalledTimes(1)
    expect(onSwitchPaymentMethod).toHaveBeenCalledTimes(1)
  })
})
