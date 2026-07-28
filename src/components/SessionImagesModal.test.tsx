import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  SessionImagesAction,
  SessionImagesModal,
} from './SessionImagesModal'
import type { ParkingSession } from '@/types/parking'

vi.mock('./AuthenticatedImage', () => ({
  default: ({ url, alt }: { url: string; alt: string }) => (
    <img src={url} alt={alt} />
  ),
}))

const baseSession: ParkingSession = {
  id: 90,
  org_id: 1,
  plate_number: '01A090AA',
  entered_at: '2026-07-18T08:00:00.000Z',
  exited_at: '2026-07-18T09:00:00.000Z',
  duration_minutes: 60,
  amount: 15000,
  status: 'completed',
  entry_method: 'auto',
  exit_method: 'auto',
  operator_id: null,
  created_at: '2026-07-18T08:00:00.000Z',
}

describe('SessionImagesModal', () => {
  it("eski image maydonlarisiz payload xato bermaydi va 'Rasm mavjud emas' ko‘rsatadi", () => {
    render(
      <SessionImagesModal session={baseSession} open onClose={() => {}} />,
    )

    expect(screen.getByText('Rasm mavjud emas')).toBeInTheDocument()
  })

  it('faqat mavjud exitVehicleImageUrl rasmini ko‘rsatadi', () => {
    render(
      <SessionImagesModal
        session={{
          ...baseSession,
          exitVehicleImageUrl: '/api/sessions/90/exit-vehicle',
        }}
        open
        onClose={() => {}}
      />,
    )

    expect(
      screen.getByRole('img', { name: 'Chiqish — avtomobil' }),
    ).toHaveAttribute('src', '/api/sessions/90/exit-vehicle')
    expect(
      screen.queryByRole('img', { name: 'Kirish — avtomobil' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('img', { name: 'Chiqish — raqam' }),
    ).not.toBeInTheDocument()
  })

  it('rasmli sessiyada action ko‘rsatadi va modalni ochadi', () => {
    render(
      <SessionImagesAction
        session={{
          ...baseSession,
          exitVehicleImageUrl: '/api/sessions/90/exit-vehicle',
        }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: "Rasmlarni ko'rish" }),
    )

    expect(
      screen.getByRole('dialog', { name: '01A090AA — rasmlar' }),
    ).toBeInTheDocument()
  })

  it("rasmsiz sessiyada action o‘rniga 'Rasm mavjud emas' ko‘rsatadi", () => {
    render(<SessionImagesAction session={baseSession} />)

    expect(screen.getByText('Rasm mavjud emas')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: "Rasmlarni ko'rish" }),
    ).not.toBeInTheDocument()
  })
})
