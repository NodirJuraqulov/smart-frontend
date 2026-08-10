import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import CashCollectionHistoryTab from './CashCollectionHistoryTab'
import { collectionDifference } from './cashCollectionAccess'
import { palette } from '@/theme/palette'
import type { CashCollection } from '@/types/cashCollection'

const { getCashCollectionsMock } = vi.hoisted(() => ({
  getCashCollectionsMock: vi.fn(),
}))

vi.mock('@/api/cashCollections', () => ({
  getCashCollections: getCashCollectionsMock,
}))

const baseCollection: CashCollection = {
  id: 1,
  org_id: 5,
  collected_by: 7,
  collected_by_name: 'Alisher Karimov',
  expected_amount: 450000,
  collected_amount: 450000,
  online_amount_snapshot: 120000,
  note: 'Toʻliq topshirildi',
  period_start: '2026-08-01T08:00:00.000Z',
  period_end: '2026-08-05T08:00:00.000Z',
  created_at: '2026-08-05T08:00:00.000Z',
}

const shortfallCollection: CashCollection = {
  ...baseCollection,
  id: 2,
  collected_by: null,
  collected_by_name: null,
  expected_amount: 300000,
  collected_amount: 280000,
  online_amount_snapshot: 50000,
  note: null,
  period_end: '2026-08-08T08:00:00.000Z',
}

function renderTab() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <CashCollectionHistoryTab orgId={5} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

function hexToRgb(hex: string): string {
  const value = Number.parseInt(hex.replace('#', ''), 16)
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`
}

function cellTexts(rowIndex: number): string[] {
  const rows = document.querySelectorAll('tbody .ant-table-row')
  return Array.from(rows[rowIndex].querySelectorAll('td')).map(
    (cell) => cell.textContent ?? '',
  )
}

describe('CashCollectionHistoryTab', () => {
  beforeEach(() => {
    getCashCollectionsMock.mockReset().mockResolvedValue({
      collections: [baseCollection, shortfallCollection],
      pagination: { page: 1, limit: 10, total: 2, total_pages: 1 },
    })
  })

  it('farqni kutilgan minus qabul qilingan sifatida hisoblaydi', () => {
    expect(collectionDifference(baseCollection)).toBe(0)
    expect(collectionDifference(shortfallCollection)).toBe(20000)
  })

  it('jadvalda inkassatsiya maʼlumotlari toʻgʻri koʻrsatiladi', async () => {
    renderTab()

    await waitFor(() =>
      expect(getCashCollectionsMock).toHaveBeenCalledWith({
        orgId: 5,
        page: 1,
        limit: 10,
      }),
    )
    await screen.findByText('Toʻliq topshirildi')

    const firstRow = cellTexts(0)
    expect(firstRow[1]).toBe('Alisher Karimov')
    expect(firstRow[2]).toMatch(/450[\s ]000/)
    expect(firstRow[3]).toMatch(/450[\s ]000/)
    expect(firstRow[4]).toMatch(/^0[\s ]/)
    expect(firstRow[5]).toMatch(/120[\s ]000/)
    expect(firstRow[6]).toBe('Toʻliq topshirildi')

    const secondRow = cellTexts(1)
    expect(secondRow[1]).toMatch(/Noma/)
    expect(secondRow[4]).toMatch(/20[\s ]000/)
    expect(secondRow[6]).toBe('—')
  })

  it('farq 0 boʻlsa neytral, 0 dan farqli boʻlsa ogohlantiruvchi rangda', async () => {
    renderTab()
    await screen.findByText('Toʻliq topshirildi')

    const neutral = document.querySelectorAll('tbody .ant-table-row')[0]
      .querySelectorAll('td')[4]
      .querySelector('span') as HTMLElement
    const warning = document.querySelectorAll('tbody .ant-table-row')[1]
      .querySelectorAll('td')[4]
      .querySelector('span') as HTMLElement

    expect(neutral.style.color).toBe('')
    expect(warning.style.color).toBe(hexToRgb(palette.warning))
  })

  it('maʼlumot boʻlmasa boʻsh holat koʻrsatiladi', async () => {
    getCashCollectionsMock.mockResolvedValue({
      collections: [],
      pagination: { page: 1, limit: 10, total: 0, total_pages: 1 },
    })
    renderTab()

    expect(
      await screen.findByText(/Hozircha inkassatsiya/),
    ).toBeInTheDocument()
  })

  it('collected_by_name mavjud boʻlsa ism koʻrsatiladi', async () => {
    renderTab()

    expect(await screen.findByText('Alisher Karimov')).toBeInTheDocument()
    expect(screen.queryByText('#7')).not.toBeInTheDocument()
  })

  it('collected_by_name null boʻlsa "Noma\u2019lum" koʻrsatiladi', async () => {
    getCashCollectionsMock.mockResolvedValue({
      collections: [shortfallCollection],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    })
    renderTab()

    expect(await screen.findByText(/Noma/)).toBeInTheDocument()
  })

  it('collected_by_name umuman kelmasa ham "Noma\u2019lum" koʻrsatiladi', async () => {
    const { collected_by_name: _omitted, ...withoutName } = baseCollection
    getCashCollectionsMock.mockResolvedValue({
      collections: [withoutName],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    })
    renderTab()

    expect(await screen.findByText(/Noma/)).toBeInTheDocument()
  })
})
