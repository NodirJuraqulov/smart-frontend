import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import OpenBarrierAction from './OpenBarrierAction'

const { openBarrierForSessionMock } = vi.hoisted(() => ({
  openBarrierForSessionMock: vi.fn(),
}))

vi.mock('@/api/parking', () => ({
  openBarrierForSession: openBarrierForSessionMock,
}))

function renderAction() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <OpenBarrierAction sessionId={7} />
      </AntdApp>
    </QueryClientProvider>,
  )
}

describe('OpenBarrierAction', () => {
  beforeEach(() => {
    openBarrierForSessionMock.mockReset()
  })

  it("'Chiqish' menyusi tanlanganda togri id va yonalish bilan chaqiriladi (regression)", async () => {
    openBarrierForSessionMock.mockResolvedValue(true)
    renderAction()

    fireEvent.click(screen.getByRole('button', { name: /Shlagbaumni ochish/ }))
    fireEvent.click(await screen.findByText('Chiqish shlagbaumini ochish'))

    await waitFor(() =>
      expect(openBarrierForSessionMock).toHaveBeenCalledWith({
        id: 7,
        direction: 'exit',
      }),
    )
  })

  it("'Kirish' menyusi tanlanganda togri id va yonalish bilan chaqiriladi (regression)", async () => {
    openBarrierForSessionMock.mockResolvedValue(true)
    renderAction()

    fireEvent.click(screen.getByRole('button', { name: /Shlagbaumni ochish/ }))
    fireEvent.click(await screen.findByText('Kirish shlagbaumini ochish'))

    await waitFor(() =>
      expect(openBarrierForSessionMock).toHaveBeenCalledWith({
        id: 7,
        direction: 'entry',
      }),
    )
  })

  it('xato bolganda xabar korsatadi', async () => {
    openBarrierForSessionMock.mockRejectedValue(new Error('network error'))
    renderAction()

    fireEvent.click(screen.getByRole('button', { name: /Shlagbaumni ochish/ }))
    fireEvent.click(await screen.findByText('Chiqish shlagbaumini ochish'))

    expect(
      await screen.findByText('Shlagbaumni ochib bo\'lmadi'),
    ).toBeInTheDocument()
  })
})
