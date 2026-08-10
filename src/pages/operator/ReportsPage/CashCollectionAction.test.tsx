import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import CashCollectionAction from './CashCollectionAction'

const { getPendingSummaryMock, createCashCollectionMock } = vi.hoisted(() => ({
  getPendingSummaryMock: vi.fn(),
  createCashCollectionMock: vi.fn(),
}))

vi.mock('@/api/cashCollections', () => ({
  getCashCollectionPendingSummary: getPendingSummaryMock,
  createCashCollection: createCashCollectionMock,
}))

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

const EXPECTED_CASH_TEXT = /450[\s\u00a0]000/
const ONLINE_TEXT = /120[\s\u00a0]000/

function openModal() {
  fireEvent.click(screen.getByRole('button', { name: 'Inkassatsiya' }))
}

describe('CashCollectionAction', () => {
  beforeEach(() => {
    getPendingSummaryMock.mockReset().mockResolvedValue({
      expected_cash_amount: 450000,
      online_amount: 120000,
      period_start: '2026-08-01T08:00:00.000Z',
      period_end: '2026-08-10T08:00:00.000Z',
    })
    createCashCollectionMock.mockReset().mockResolvedValue({
      id: 1,
      org_id: 5,
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

  it('tugma bosilganda pending-summary yuklanadi va ko‘rsatiladi', async () => {
    renderAction()
    openModal()

    await waitFor(() =>
      expect(getPendingSummaryMock).toHaveBeenCalledWith(5),
    )

    expect(await screen.findByText(EXPECTED_CASH_TEXT)).toBeInTheDocument()
    expect(screen.getByText(ONLINE_TEXT)).toBeInTheDocument()
    expect(screen.getByText('Kutilayotgan naqd')).toBeInTheDocument()
    expect(screen.getByText('Joriy davr onlayn')).toBeInTheDocument()
    expect(screen.getByText(/— hozir/)).toBeInTheDocument()
  })

  it('tasdiqlashda to‘g‘ri body bilan POST yuboriladi va modal yopiladi', async () => {
    const { invalidateSpy } = renderAction()
    openModal()
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
        collected_amount: 430000,
        note: '20 ming kam chiqdi',
      }),
    )

    await waitFor(() =>
      expect(screen.queryByText('Kutilayotgan naqd')).not.toBeInTheDocument(),
    )
    expect(await screen.findByText('Inkassatsiya saqlandi')).toBeInTheDocument()

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (call) => JSON.stringify(call[0]?.queryKey),
    )
    expect(invalidatedKeys).toContain(JSON.stringify(['cash-collections']))
    expect(invalidatedKeys).toContain(JSON.stringify(['reports']))
  })

  it('summa kiritilmasa POST yuborilmaydi', async () => {
    renderAction()
    openModal()
    await screen.findByText(EXPECTED_CASH_TEXT)

    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))

    expect(await screen.findByText('Summani kiriting')).toBeInTheDocument()
    expect(createCashCollectionMock).not.toHaveBeenCalled()
  })

  it('summa 0 bo‘lsa POST yuborilmaydi', async () => {
    renderAction()
    openModal()
    await screen.findByText(EXPECTED_CASH_TEXT)

    fireEvent.change(document.querySelector('#collected_amount') as HTMLElement, {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tasdiqlash' }))

    expect(
      await screen.findByText(/0 dan katta bo/),
    ).toBeInTheDocument()
    expect(createCashCollectionMock).not.toHaveBeenCalled()
  })
})
