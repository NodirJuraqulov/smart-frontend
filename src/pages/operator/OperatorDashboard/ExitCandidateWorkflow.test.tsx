import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ExitCandidateWorkflow from './ExitCandidateWorkflow'
import type { ExitCandidateNext } from '@/types/exitCandidate'

const { getNextExitCandidateMock } = vi.hoisted(() => ({
  getNextExitCandidateMock: vi.fn(),
}))

vi.mock('@/api/exitCandidates', () => ({
  getNextExitCandidate: getNextExitCandidateMock,
}))

vi.mock('./ExitCandidateModal', () => ({
  default: ({
    candidate,
    onClose,
    onResolved,
  }: {
    candidate: ExitCandidateNext
    onClose: () => void
    onResolved: () => void
  }) => (
    <div role="dialog">
      <span>{candidate.candidate_id}</span>
      <button onClick={onClose}>close-candidate</button>
      <button onClick={onResolved}>resolve-candidate</button>
    </div>
  ),
}))

const firstCandidate: ExitCandidateNext = {
  candidate_id: 'candidate-1',
  status: 'pending',
  webhook_event_id: 'event-1',
  detected_plate: '01A777BA',
  camera_event_at: '2026-08-01T08:00:00.000Z',
  exit_images: {
    overview_url: null,
    vehicle_url: null,
    image_available: false,
  },
  matched_session: null,
  pending_count_for_org: 2,
}

const secondCandidate: ExitCandidateNext = {
  ...firstCandidate,
  candidate_id: 'candidate-2',
  detected_plate: '01B555BB',
  pending_count_for_org: 1,
}

const noResolvedIds: string[] = []
const noopConsumed = () => undefined

function renderWorkflow(props?: {
  newCandidateSignal?: number
  statusRefreshSignal?: number
  resolvedCandidateIds?: string[]
  autoOpenBlocked?: boolean
}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitCandidateWorkflow
          newCandidateSignal={props?.newCandidateSignal ?? 0}
          statusRefreshSignal={props?.statusRefreshSignal ?? 0}
          resolvedCandidateIds={props?.resolvedCandidateIds ?? noResolvedIds}
          onResolvedIdsConsumed={noopConsumed}
          autoOpenBlocked={props?.autoOpenBlocked}
          onDataChanged={vi.fn()}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { ...view, queryClient }
}

function workflowTree(
  queryClient: QueryClient,
  resolvedCandidateIds: string[],
  onResolvedIdsConsumed: (ids: string[]) => void = noopConsumed,
) {
  return (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitCandidateWorkflow
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

describe('ExitCandidateWorkflow', () => {
  beforeEach(() => {
    getNextExitCandidateMock.mockReset()
  })

  it('GET next 204 bo‘lsa modal ochmaydi va badge 0 bo‘ladi', async () => {
    getNextExitCandidateMock.mockResolvedValue(null)
    renderWorkflow()

    const button = await screen.findByRole('button', {
      name: 'Chiqishni tekshirish (0)',
    })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(getNextExitCandidateMock).toHaveBeenCalledTimes(1)
  })

  it('GET next 200 bo‘lsa modalni avtomatik ochadi va countni ko‘rsatadi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow()

    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')
    expect(
      screen.getByRole('button', { name: 'Chiqishni tekshirish (2)' }),
    ).toBeInTheDocument()
  })

  it('operator yopganda candidate pending qoladi va tugma orqali qayta ochiladi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow()
    fireEvent.click(await screen.findByRole('button', { name: 'close-candidate' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Chiqishni tekshirish (2)' }),
    )

    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')
  })

  it('candidate hal qilingach GET next chaqirib keyingi modalni ochadi', async () => {
    getNextExitCandidateMock
      .mockResolvedValueOnce(firstCandidate)
      .mockResolvedValueOnce(secondCandidate)
    renderWorkflow()
    fireEvent.click(
      await screen.findByRole('button', { name: 'resolve-candidate' }),
    )

    await waitFor(() => expect(getNextExitCandidateMock).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-2')
    expect(
      screen.getByRole('button', { name: 'Chiqishni tekshirish (1)' }),
    ).toBeInTheDocument()
  })

  it('yangi WebSocket signalida modal yopiq bo‘lsa next candidate ni ochadi', async () => {
    getNextExitCandidateMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(firstCandidate)
    const view = renderWorkflow()
    await screen.findByRole('button', { name: 'Chiqishni tekshirish (0)' })

    view.rerender(
      <QueryClientProvider client={view.queryClient}>
        <AntdApp>
          <ExitCandidateWorkflow
            newCandidateSignal={1}
            statusRefreshSignal={0}
            resolvedCandidateIds={noResolvedIds}
            onResolvedIdsConsumed={noopConsumed}
            onDataChanged={vi.fn()}
          />
        </AntdApp>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')
  })

  it('boshqa modal ochiq bo‘lsa yangi candidate modalini avtomatik ochmaydi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow({ autoOpenBlocked: true })

    expect(
      await screen.findByRole('button', { name: 'Chiqishni tekshirish (2)' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('N > 0 bo‘lsa tugma exit modalni ochadi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    renderWorkflow({ autoOpenBlocked: true })

    const button = await screen.findByRole('button', {
      name: 'Chiqishni tekshirish (2)',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(button)

    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')
    expect(getNextExitCandidateMock).toHaveBeenCalledTimes(1)
  })

  it('ochiq candidate resolved eventi kelganda modal avtomatik yopiladi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')

    view.rerender(workflowTree(view.queryClient, ['candidate-1']))

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('boshqa candidate resolved eventi kelganda modal ochiq qoladi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')

    view.rerender(workflowTree(view.queryClient, ['candidate-2']))

    await waitFor(() =>
      expect(getNextExitCandidateMock).toHaveBeenCalledTimes(2),
    )
    expect(screen.getByRole('dialog')).toHaveTextContent('candidate-1')
  })

  it('resolved eventidan keyin navbatdagi candidate avtomatik ochilmaydi', async () => {
    getNextExitCandidateMock
      .mockResolvedValueOnce(firstCandidate)
      .mockResolvedValue(secondCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')

    view.rerender(workflowTree(view.queryClient, ['candidate-1']))

    const reviewButton = await screen.findByRole('button', {
      name: 'Chiqishni tekshirish (1)',
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(reviewButton)

    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-2')
  })

  it('bitta batchdagi bir nechta resolved id ichidan ochiq candidate yopiladi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')

    view.rerender(
      workflowTree(view.queryClient, ['candidate-1', 'candidate-2']),
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('ochiq candidate batchning oxirgi idsi bo‘lsa ham yopiladi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    const view = renderWorkflow()
    expect(await screen.findByRole('dialog')).toHaveTextContent('candidate-1')

    view.rerender(
      workflowTree(view.queryClient, ['candidate-9', 'candidate-1']),
    )

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
  })

  it('ishlatilgan resolved idlarni dashboardga qaytaradi', async () => {
    getNextExitCandidateMock.mockResolvedValue(firstCandidate)
    const onResolvedIdsConsumed = vi.fn()
    const view = renderWorkflow()
    await screen.findByRole('dialog')

    const ids = ['candidate-1', 'candidate-2']
    view.rerender(workflowTree(view.queryClient, ids, onResolvedIdsConsumed))

    await waitFor(() =>
      expect(onResolvedIdsConsumed).toHaveBeenCalledWith(ids),
    )
    expect(onResolvedIdsConsumed).toHaveBeenCalledTimes(1)
  })
})
