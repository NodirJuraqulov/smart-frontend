import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import EntryCandidateWorkflow from './EntryCandidateWorkflow'
import type { EntryCandidateNext } from '@/types/entryCandidate'

const { getNextEntryCandidateMock } = vi.hoisted(() => ({
  getNextEntryCandidateMock: vi.fn(),
}))

vi.mock('@/api/entryCandidates', () => ({
  getNextEntryCandidate: getNextEntryCandidateMock,
}))

vi.mock('./EntryCandidateModal', () => ({
  default: ({
    candidate,
    onResolved,
  }: {
    candidate: EntryCandidateNext
    onResolved: () => void
  }) => (
    <div role="dialog">
      <span>{candidate.candidate_id}</span>
      <button onClick={onResolved}>resolve-entry</button>
    </div>
  ),
}))

const firstCandidate: EntryCandidateNext = {
  candidate_id: 1,
  detected_plate: '01A777BA',
  camera_event_at: '2026-08-02T08:00:00.000Z',
  confidence: 98,
  reason: 'capacity_full',
  entry_images: {
    overview_url: null,
    vehicle_url: null,
    image_available: false,
  },
  pending_count_for_org: 2,
}

const secondCandidate: EntryCandidateNext = {
  ...firstCandidate,
  candidate_id: 2,
  pending_count_for_org: 1,
}

function renderWorkflow(options?: {
  autoOpenBlocked?: boolean
  requestModalOpen?: () => boolean
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EntryCandidateWorkflow
          newCandidateSignal={0}
          statusRefreshSignal={0}
          resolvedCandidateId={null}
          autoOpenBlocked={options?.autoOpenBlocked}
          requestModalOpen={options?.requestModalOpen}
          onDataChanged={vi.fn()}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('EntryCandidateWorkflow', () => {
  beforeEach(() => {
    getNextEntryCandidateMock.mockReset()
  })

  it('GET next 204 bo‘lsa entry modalni ochmaydi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(null)
    renderWorkflow()

    expect(
      await screen.findByRole('button', { name: 'Kirishni tekshirish (0)' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('GET next 200 bo‘lsa entry modalni avtomatik ochadi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow()

    expect(await screen.findByRole('dialog')).toHaveTextContent('1')
    expect(
      screen.getByRole('button', { name: 'Kirishni tekshirish (2)' }),
    ).toBeInTheDocument()
  })

  it('exit modal ownership band bo‘lsa faqat badge yangilanadi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow({ requestModalOpen: () => false })

    expect(
      await screen.findByRole('button', { name: 'Kirishni tekshirish (2)' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('candidate hal qilingach nextni chaqirib keyingi entry modalni ochadi', async () => {
    getNextEntryCandidateMock
      .mockResolvedValueOnce(firstCandidate)
      .mockResolvedValueOnce(secondCandidate)
    renderWorkflow()
    fireEvent.click(await screen.findByRole('button', { name: 'resolve-entry' }))

    await waitFor(() =>
      expect(getNextEntryCandidateMock).toHaveBeenCalledTimes(2),
    )
    expect(await screen.findByRole('dialog')).toHaveTextContent('2')
  })
})
