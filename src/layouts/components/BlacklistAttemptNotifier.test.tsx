import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App as AntdApp } from 'antd'
import BlacklistAttemptNotifier from './BlacklistAttemptNotifier'

const {
  acquireSocketMock,
  releaseSocketMock,
  onMock,
  offMock,
  useAppSelectorMock,
} = vi.hoisted(() => ({
  acquireSocketMock: vi.fn(),
  releaseSocketMock: vi.fn(),
  onMock: vi.fn(),
  offMock: vi.fn(),
  useAppSelectorMock: vi.fn(),
}))

vi.mock('@/services/socket', () => ({
  acquireSocket: acquireSocketMock,
  releaseSocket: releaseSocketMock,
}))

vi.mock('@/hooks/redux', () => ({
  useAppSelector: useAppSelectorMock,
}))

describe('BlacklistAttemptNotifier', () => {
  beforeEach(() => {
    onMock.mockReset()
    offMock.mockReset()
    acquireSocketMock.mockReset().mockReturnValue({ on: onMock, off: offMock })
    releaseSocketMock.mockReset()
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({
          auth: {
            accessToken: 'access-token',
            user: { role: 'operator' },
          },
        }),
    )
  })

  it("operator layoutida blacklist_attempt kelganda yuqori o'ngda bildirishnoma ko'rsatadi", async () => {
    const view = render(
      <AntdApp>
        <BlacklistAttemptNotifier />
      </AntdApp>,
    )
    const handler = onMock.mock.calls.find(
      ([event]) => event === 'blacklist_attempt',
    )?.[1] as (payload: unknown) => void

    act(() => {
      handler({
        attemptId: 31,
        orgId: 3,
        plateNumber: '01B555BB',
        attemptedAt: '2026-08-20T09:15:00.000Z',
        imageUrl: '/api/webhook-events/91/images/overview',
      })
    })

    expect(await screen.findByText("Qora ro'yxat")).toBeInTheDocument()
    expect(
      screen.getByText("Qora ro'yxatdagi mashina: 01B555BB"),
    ).toBeInTheDocument()

    view.unmount()
    expect(offMock).toHaveBeenCalledWith('blacklist_attempt', handler)
    expect(releaseSocketMock).toHaveBeenCalledTimes(1)
  })
})
