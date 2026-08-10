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

const noResolvedIds: number[] = []
const noopConsumed = () => undefined

function renderWorkflow(options?: {
  autoOpenBlocked?: boolean
  requestModalOpen?: () => boolean
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EntryCandidateWorkflow
          newCandidateSignal={0}
          statusRefreshSignal={0}
          resolvedCandidateIds={noResolvedIds}
          onResolvedIdsConsumed={noopConsumed}
          autoOpenBlocked={options?.autoOpenBlocked}
          requestModalOpen={options?.requestModalOpen}
          onDataChanged={vi.fn()}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { ...view, queryClient }
}

function workflowTree(
  queryClient: QueryClient,
  resolvedCandidateIds: number[],
  onResolvedIdsConsumed: (ids: number[]) => void = noopConsumed,
) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <EntryCandidateWorkflow
          newCandidateSignal={0}
          statusRefreshSignal={0}
          resolvedCandidateIds={resolvedCandidateIds}
          onResolvedIdsConsumed={onResolvedIdsConsumed}
          onDataChanged={vi.fn()}
        />
      </AntdApp>
    </QueryClientProvider>
  )
}

describe('EntryCandidateWorkflow', () => {
  beforeEach(() => {
    getNextEntryCandidateMock.mockReset()
  })

  it('GET next 204 bo‘lsa entry modalni ochmaydi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(null)
    renderWorkflow()

    const button = await screen.findByRole('button', {
      name: 'Kirishni tekshirish (0)',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getNextEntryCandidateMock).toHaveBeenCalledTimes(1)
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

  it('N > 0 bo‘lsa tugma entry modalni ochadi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow({ autoOpenBlocked: true })

    const button = await screen.findByRole('button', {
      name: 'Kirishni tekshirish (2)',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(button)

    expect(await screen.findByRole('dialog')).toHaveTextContent('1')
    expect(getNextEntryCandidateMock).toHaveBeenCalledTimes(1)
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

  it('ochiq candidate resolved eventi kelganda modal avtomatik yopiladi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('1')

    view.rerender(workflowTree(view.queryClient, [1]))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('boshqa candidate resolved eventi kelganda modal ochiq qoladi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('1')

    view.rerender(workflowTree(view.queryClient, [2]))

    await waitFor(() =>
      expect(getNextEntryCandidateMock).toHaveBeenCalledTimes(2),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('1')
  })

  it('resolved eventidan keyin navbatdagi candidate avtomatik ochilmaydi', async () => {
    getNextEntryCandidateMock
      .mockResolvedValueOnce(firstCandidate)
      .mockResolvedValue(secondCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('1')

    view.rerender(workflowTree(view.queryClient, [1]))

    const reviewButton = await screen.findByRole('button', {
      name: 'Kirishni tekshirish (1)',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(reviewButton)

    expect(await screen.findByRole('dialog')).toHaveTextContent('2')
  })

  it('bitta batchdagi bir nechta resolved id ichidan ochiq candidate yopiladi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('1')

    view.rerender(workflowTree(view.queryClient, [1, 2]))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('ochiq candidate batchning oxirgi idsi bo‘lsa ham yopiladi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('1')

    view.rerender(workflowTree(view.queryClient, [9, 1]))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('ishlatilgan resolved idlarni dashboardga qaytaradi', async () => {
    getNextEntryCandidateMock.mockResolvedValue(firstCandidate)
    const onResolvedIdsConsumed = vi.fn()
    const view = renderWorkflow()
    await screen.findByRole('dialog')

    const ids = [1, 2]
    view.rerender(workflowTree(view.queryClient, ids, onResolvedIdsConsumed))

    await waitFor(() =>
      expect(onResolvedIdsConsumed).toHaveBeenCalledWith(ids),
    )
    expect(onResolvedIdsConsumed).toHaveBeenCalledTimes(1)
  })
})
