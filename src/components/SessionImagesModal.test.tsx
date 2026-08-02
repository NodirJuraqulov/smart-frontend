import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  SessionImagesAction,
  SessionImagesModal,
} from './SessionImagesModal'
import type { ParkingSession } from '@/types/parking'

const { authenticatedImageMock } = vi.hoisted(() => ({
  authenticatedImageMock: vi.fn(
    ({ url, alt }: { url: string; alt: string }) => (
      <img src={url} alt={alt} data-authenticated-image="true" />
    ),
  ),
}))

vi.mock('./AuthenticatedImage', () => ({
  default: authenticatedImageMock,
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

function renderModal(session: ParkingSession = baseSession) {
  return render(
    <SessionImagesModal session={session} open onClose={() => {}} />,
  )
}

describe('SessionImagesModal', () => {
  beforeEach(() => {
    authenticatedImageMock.mockClear()
  })

  it('faqat kirish va chiqish avtomobil bloklarini ko‘rsatadi', () => {
    renderModal()

    expect(screen.getByText('Kirish — avtomobil')).toBeInTheDocument()
    expect(screen.getByText('Chiqish — avtomobil')).toBeInTheDocument()
    expect(screen.queryByText('Kirish — raqam')).not.toBeInTheDocument()
    expect(screen.queryByText('Chiqish — raqam')).not.toBeInTheDocument()
  })

  it('overview URLlarni vehicle URLlardan ustun qo‘yadi', () => {
    renderModal({
      ...baseSession,
      entryOverviewImageUrl: '/api/sessions/90/entry-overview',
      entryVehicleImageUrl: '/api/sessions/90/entry-vehicle',
      exitOverviewImageUrl: '/api/sessions/90/exit-overview',
      exitVehicleImageUrl: '/api/sessions/90/exit-vehicle',
    })

    expect(
      screen.getByRole('img', { name: 'Kirish — avtomobil' }),
    ).toHaveAttribute('src', '/api/sessions/90/entry-overview')
    expect(
      screen.getByRole('img', { name: 'Chiqish — avtomobil' }),
    ).toHaveAttribute('src', '/api/sessions/90/exit-overview')
  })

  it('eski sessiya uchun faqat vehicle URLlarni fallback sifatida ishlatadi', () => {
    renderModal({
      ...baseSession,
      entryVehicleImageUrl: '/api/sessions/90/entry-vehicle',
      exitVehicleImageUrl: '/api/sessions/90/exit-vehicle',
    })

    expect(
      screen.getByRole('img', { name: 'Kirish — avtomobil' }),
    ).toHaveAttribute('src', '/api/sessions/90/entry-vehicle')
    expect(
      screen.getByRole('img', { name: 'Chiqish — avtomobil' }),
    ).toHaveAttribute('src', '/api/sessions/90/exit-vehicle')
  })

  it('plate URLlarni hech qachon render yoki fallback qilmaydi', () => {
    renderModal({
      ...baseSession,
      entryPlateImageUrl: '/api/sessions/90/entry-plate',
      exitPlateImageUrl: '/api/sessions/90/exit-plate',
    })

    expect(
      document.querySelector('[data-authenticated-image="true"]'),
    ).not.toBeInTheDocument()
    expect(authenticatedImageMock).not.toHaveBeenCalled()
    expect(screen.getAllByText('Rasm mavjud emas')).toHaveLength(2)
  })

  it('bitta rasm yo‘q bo‘lsa uning empty stateini va ikkinchi rasmni saqlaydi', () => {
    renderModal({
      ...baseSession,
      exitOverviewImageUrl: '/api/sessions/90/exit-overview',
    })

    expect(screen.getByText('Rasm mavjud emas')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Chiqish — avtomobil' }),
    ).toHaveAttribute('src', '/api/sessions/90/exit-overview')
  })

  it('rasmlarni authenticated image loader orqali beradi', () => {
    renderModal({
      ...baseSession,
      entryOverviewImageUrl: '/api/sessions/90/entry-overview',
    })

    expect(authenticatedImageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/sessions/90/entry-overview',
        alt: 'Kirish — avtomobil',
      }),
      undefined,
    )
    expect(
      screen.getByRole('img', { name: 'Kirish — avtomobil' }),
    ).toHaveAttribute('data-authenticated-image', 'true')
  })

  it('mobile/tabletda stack va desktopda ikki teng ustun layoutini saqlaydi', () => {
    renderModal()

    expect(screen.getByTestId('session-vehicle-images-grid')).toHaveClass(
      'grid-cols-1',
      'lg:grid-cols-2',
    )
  })

  it('overview yoki legacy vehicle rasmi bo‘lsa action modalni ochadi', () => {
    render(
      <SessionImagesAction
        session={{
          ...baseSession,
          entryOverviewImageUrl: '/api/sessions/90/entry-overview',
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

  it('faqat plate rasmi mavjud sessiyada action ko‘rsatmaydi', () => {
    const plateOnlySession = {
      ...baseSession,
      entryPlateImageUrl: '/api/sessions/90/entry-plate',
    } as ParkingSession & { entryPlateImageUrl: string }

    render(
      <SessionImagesAction session={plateOnlySession} />,
    )

    expect(screen.getByText('Rasm mavjud emas')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: "Rasmlarni ko'rish" }),
    ).not.toBeInTheDocument()
  })
})
