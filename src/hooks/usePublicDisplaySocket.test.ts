import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePublicDisplaySocket } from './usePublicDisplaySocket'

const { connectMock, disconnectMock, onMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
  disconnectMock: vi.fn(),
  onMock: vi.fn(),
}))

vi.mock('@/services/publicDisplaySocket', () => ({
  connectPublicDisplaySocket: connectMock,
}))

describe('usePublicDisplaySocket', () => {
  beforeEach(() => {
    onMock.mockReset()
    disconnectMock.mockReset()
    connectMock.mockReset().mockReturnValue({
      on: onMock,
      disconnect: disconnectMock,
    })
  })

  it('backendning snake_case entry va exit status payloadlarini uzatadi', () => {
    const onEntryStatusChanged = vi.fn()
    const onExitStatusChanged = vi.fn()
    const { unmount } = renderHook(() =>
      usePublicDisplaySocket(7, {
        onEntryStatusChanged,
        onExitStatusChanged,
      }),
    )
    const entryHandler = onMock.mock.calls.find(
      ([event]) => event === 'public:entry-status-changed',
    )?.[1] as (payload: unknown) => void
    const exitHandler = onMock.mock.calls.find(
      ([event]) => event === 'public:exit-status-changed',
    )?.[1] as (payload: unknown) => void
    const entryPayload = {
      state: 'awaiting_operator',
      plate: '01A123BC',
      barrier_status: null,
      updated_at: '2026-08-02T10:00:00.000Z',
    } as const
    const exitPayload = {
      state: 'completed',
      plate: '01A123BC',
      session_source: 'regular',
      amount: 15000,
      payment_method: 'cash',
      duration_minutes: 90,
      barrier_status: 'opened',
      updated_at: '2026-08-02T10:00:00.000Z',
    } as const

    act(() => {
      entryHandler(entryPayload)
      exitHandler(exitPayload)
    })

    expect(onEntryStatusChanged).toHaveBeenCalledWith(entryPayload)
    expect(onExitStatusChanged).toHaveBeenCalledWith(exitPayload)
    unmount()
    expect(disconnectMock).toHaveBeenCalledOnce()
  })

  it('camelCase yoki toliq bolmagan payloadlarni qabul qilmaydi', () => {
    const onEntryStatusChanged = vi.fn()
    const onExitStatusChanged = vi.fn()
    renderHook(() =>
      usePublicDisplaySocket(7, {
        onEntryStatusChanged,
        onExitStatusChanged,
      }),
    )
    const entryHandler = onMock.mock.calls.find(
      ([event]) => event === 'public:entry-status-changed',
    )?.[1] as (payload: unknown) => void
    const exitHandler = onMock.mock.calls.find(
      ([event]) => event === 'public:exit-status-changed',
    )?.[1] as (payload: unknown) => void

    act(() => {
      entryHandler({
        state: 'completed',
        plate: '01A123BC',
        barrierStatus: 'opened',
        updatedAt: '2026-08-02T10:00:00.000Z',
      })
      exitHandler({
        state: 'completed',
        plate: '01A123BC',
        barrier_status: 'opened',
        updated_at: '2026-08-02T10:00:00.000Z',
      })
    })

    expect(onEntryStatusChanged).not.toHaveBeenCalled()
    expect(onExitStatusChanged).not.toHaveBeenCalled()
  })

  it('musbat butun bolmagan orgId uchun socket ochmaydi', () => {
    renderHook(() => usePublicDisplaySocket(0, {}))

    expect(connectMock).not.toHaveBeenCalled()
  })
})
