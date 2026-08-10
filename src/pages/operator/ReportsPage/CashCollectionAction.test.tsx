import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import CashCollectionAction from './CashCollectionAction'

const { getOperatorsMock, getPendingSummaryMock, createCashCollectionMock } =
  vi.hoisted(() => ({
    getOperatorsMock: vi.fn(),
    getPendingSummaryMock: vi.fn(),
    createCashCollectionMock: vi.fn(),
  }))

vi.mock('@/api/cashCollections', () => ({
  getCashCollectionOperators: getOperatorsMock,
  getCashCollectionPendingSummary: getPendingSummaryMock,
  createCashCollection: createCashCollectionMock,
}))

const EXPECTED_CASH_TEXT = /450[\s ]000/
const ONLINE_TEXT = /120[\s ]000/

function renderAction() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <CashCollectionAction orgId={5} />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { invalidateSpy }
}

function openModal() {
  fireEvent.click(screen.getByRole('button', { name: 'Inkassatsiya' }))
}

async function selectOperator(name: string) {
  const select = (document.querySelector('#operator_id') as HTMLElement).closest(
    '.ant-select',
  ) as HTMLElement
  fireEvent.mouseDown(select)
  await waitFor(() => screen.getAllByTitle(name))
  fireEvent.click(screen.getAllByTitle(name)[0])
}

describe('CashCollectionAction', () => {
  beforeEach(() => {
    getOperatorsMock.mockReset().mockResolvedValue([
      { id: 11, name: 'Alisher Karimov' },
      { id: 12, name: 'Bekzod Tursunov' },
    ])
    getPendingSummaryMock.mockReset().mockResolvedValue({
      operator_id: 11,
      expected_cash_amount: 450000,
      online_amount: 120000,
      period_start: '2026-08-01T08:00:00.000Z',
      period_end: '2026-08-10T08:00:00.000Z',
    })
    createCashCollectionMock.mockReset().mockResolvedValue({
      id: 1,
      org_id: 5,
      operator_id: 11,
      collected_by: 7,
      expected_amount: 450000,
      collected_amount: 450000,
      online_amount_snapshot: 120000,
      note: null,
      period_start: '2026-08-01T08:00:00.000Z',
      period_end: '2026-08-10T08:00:00.000Z',
      created_at: '2026-08-10T08:00:00.000Z',
    })
  })

  it('modal ochilganda operatorlar roʻyxati yuklanadi', async () => {
    renderAction()
    openModal()

    await waitFor(() => expect(getOperatorsMock).toHaveBeenCalledWith(5))

    expect(
      await screen.findByText('Summani koʻrish uchun operatorni tanlang'),
    ).toBeInTheDocument()
    expect(getPendingSummaryMock).not.toHaveBeenCalled()
  })

  it('operator tanlanganda pending-summary shu operator_id bilan chaqiriladi', async () => {
    renderAction()
    openModal()
    await screen.findByText('Summani koʻrish uchun operatorni tanlang')

    await selectOperator('Bekzod Tursunov')

    await waitFor(() =>
      expect(getPendingSummaryMock).toHaveBeenCalledWith({
        orgId: 5,
        operatorId: 12,
      }),
    )

    expect(await screen.findByText(EXPECTED_CASH_TEXT)).toBeInTheDocument()
    expect(screen.getByText(ONLINE_TEXT)).toBeInTheDocument()
    expect(screen.getByText('Kutilayotgan naqd')).toBeInTheDocument()
    expect(screen.getByText(/— hozir/)).toBeInTheDocument()
    expect(
      screen.queryByText('Summani koʻrish uchun operatorni tanlang'),
    ).not.toBeInTheDocument()
  })

  it('tasdiqlashda operator_id bilan POST yuboriladi va modal yopiladi', async () => {
    const { invalidateSpy } = renderAction()
    openModal()
    await screen.findByText('Summani koʻrish uchun operatorni tanlang')
    await selectOperator('Alisher Karimov')
    await screen.findByText(EXPECTED_CASH_TEXT)

    fireEvent.change(document.querySelector('#collected_amount') as HTMLElement, {
      target: { value: '430000' },
    })
    fireEvent.change(document.querySelector('#note') as HTMLElement, {
      target: { value: '  20 ming kam chiqdi  ' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))

    await waitFor(() =>
      expect(createCashCollectionMock).toHaveBeenCalledWith({
        orgId: 5,
        operator_id: 11,
        collected_amount: 430000,
        note: '20 ming kam chiqdi',
      }),
    )

    await waitFor(() =>
      expect(screen.queryByText('Kutilayotgan naqd')).not.toBeInTheDocument(),
    )
    expect(await screen.findByText('Inkassatsiya saqlandi')).toBeInTheDocument()

    const invalidatedKeys = invalidateSpy.mock.calls.map((call) =>
      JSON.stringify(call[0]?.queryKey),
    )
    expect(invalidatedKeys).toContain(JSON.stringify(['cash-collections']))
    expect(invalidatedKeys).toContain(JSON.stringify(['reports']))
  })

  it('operator tanlanmasa POST yuborilmaydi', async () => {
    renderAction()
    openModal()
    await screen.findByText('Summani koʻrish uchun operatorni tanlang')

    fireEvent.change(document.querySelector('#collected_amount') as HTMLElement, {
      target: { value: '430000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))

    expect(await screen.findByText('Operatorni tanlang')).toBeInTheDocument()
    expect(createCashCollectionMock).not.toHaveBeenCalled()
  })

  it('summa kiritilmasa yoki 0 boʻlsa POST yuborilmaydi', async () => {
    renderAction()
    openModal()
    await screen.findByText('Summani koʻrish uchun operatorni tanlang')
    await selectOperator('Alisher Karimov')
    await screen.findByText(EXPECTED_CASH_TEXT)

    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))
    expect(await screen.findByText('Summani kiriting')).toBeInTheDocument()
    expect(createCashCollectionMock).not.toHaveBeenCalled()

    fireEvent.change(document.querySelector('#collected_amount') as HTMLElement, {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))

    expect(await screen.findByText(/0 dan katta bo/)).toBeInTheDocument()
    expect(createCashCollectionMock).not.toHaveBeenCalled()
  })

  it('operatorlar roʻyxati boʻsh boʻlsa xabar koʻrsatiladi va tugma disabled', async () => {
    getOperatorsMock.mockResolvedValue([])
    renderAction()
    openModal()

    expect(
      await screen.findByText("Bu stoyankada hali operator qo'shilmagan"),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tasdiqlash' })).toBeDisabled()
    expect(document.querySelector('#collected_amount')).toBeNull()
    expect(getPendingSummaryMock).not.toHaveBeenCalled()
  })
})
