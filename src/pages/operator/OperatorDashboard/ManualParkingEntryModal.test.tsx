import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ManualParkingEntryModal from './ManualParkingEntryModal'

const { createManualParkingEntryMock, retryEntryBarrierMock } = vi.hoisted(
  () => ({
    createManualParkingEntryMock: vi.fn(),
    retryEntryBarrierMock: vi.fn(),
  }),
)

vi.mock('@/api/entryCandidates', () => ({
  createManualParkingEntry: createManualParkingEntryMock,
  retryEntryBarrier: retryEntryBarrierMock,
}))

function renderModal() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  const onClose = vi.fn()
  const onDataChanged = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ManualParkingEntryModal
          open
          onClose={onClose}
          onDataChanged={onDataChanged}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { onClose, onDataChanged }
}

describe('ManualParkingEntryModal', () => {
  beforeEach(() => {
    createManualParkingEntryMock.mockReset().mockResolvedValue({
      session_id: 1,
      plate: '01A777BA',
      barrier_status: 'opened',
    })
    retryEntryBarrierMock.mockReset().mockResolvedValue({
      barrier_status: 'opened',
    })
  })

  it('plate bo‘sh bo‘lsa Kiritish va ochishni bloklaydi', () => {
    renderModal()

    expect(
      screen.getByRole('button', { name: 'Kiritish va ochish' }),
    ).toBeDisabled()
  })

  it('Boshqa sabab tanlanganda izohni majburiy qiladi', async () => {
    renderModal()
    fireEvent.change(screen.getByPlaceholderText('Davlat raqamini kiriting'), {
      target: { value: '01A777BA' },
    })
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Boshqa'))

    expect(
      screen.getByText('“Boshqa” sababi uchun izoh majburiy'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Kiritish va ochish' }),
    ).toBeDisabled()
  })

  it('manual-entry muvaffaqiyatli bo‘lsa payload, refetch va close ishlaydi', async () => {
    const { onClose, onDataChanged } = renderModal()
    fireEvent.change(screen.getByPlaceholderText('Davlat raqamini kiriting'), {
      target: { value: ' 01A777BA ' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Kiritish va ochish' }),
    )

    await waitFor(() =>
      expect(createManualParkingEntryMock).toHaveBeenCalledWith({
        plate_number: '01A777BA',
        reason: 'camera_unavailable',
      }),
    )
    expect(onDataChanged).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('manual-entry 409 bo‘lsa aniq xabar ko‘rsatadi', async () => {
    createManualParkingEntryMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: 'active session exists' } },
    })
    renderModal()
    const input = screen.getByPlaceholderText('Davlat raqamini kiriting')
    fireEvent.change(input, { target: { value: '01A777BA' } })
    fireEvent.click(
      screen.getByRole('button', { name: 'Kiritish va ochish' }),
    )

    expect(
      await screen.findByText('Bu raqam allaqachon stoyanka ichida'),
    ).toBeInTheDocument()
    await waitFor(() => expect(input).toHaveFocus())
  })

  it('manual-entry barrier failed bo‘lsa session retry endpointini ishlatadi', async () => {
    createManualParkingEntryMock.mockResolvedValue({
      session_id: 27,
      plate: '01A777BA',
      barrier_status: 'failed',
    })
    const { onClose } = renderModal()
    fireEvent.change(screen.getByPlaceholderText('Davlat raqamini kiriting'), {
      target: { value: '01A777BA' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Kiritish va ochish' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Qayta ochish' }))

    await waitFor(() => expect(retryEntryBarrierMock).toHaveBeenCalledWith(27))
    expect(onClose).toHaveBeenCalled()
  })
})
