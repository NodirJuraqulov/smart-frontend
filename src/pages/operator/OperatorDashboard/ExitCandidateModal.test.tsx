import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ExitCandidateModal from './ExitCandidateModal'
import type {
  ExitCandidateActiveSession,
  ExitCandidateNext,
  ExitCandidateSearchResult,
} from '@/types/exitCandidate'

const {
  confirmExitCandidateMock,
  forceOpenExitCandidateMock,
  retryExitCandidateBarrierMock,
  searchExitCandidateMock,
} = vi.hoisted(() => ({
  confirmExitCandidateMock: vi.fn(),
  forceOpenExitCandidateMock: vi.fn(),
  retryExitCandidateBarrierMock: vi.fn(),
  searchExitCandidateMock: vi.fn(),
}))

vi.mock('@/api/exitCandidates', () => ({
  confirmExitCandidate: confirmExitCandidateMock,
  forceOpenExitCandidate: forceOpenExitCandidateMock,
  retryExitCandidateBarrier: retryExitCandidateBarrierMock,
  searchExitCandidate: searchExitCandidateMock,
}))

vi.mock('@/components/AuthenticatedImage', () => ({
  default: ({ url, alt }: { url?: string | null; alt: string }) =>
    url ? <img data-testid="authenticated-image" src={url} alt={alt} /> : null,
}))

const candidate: ExitCandidateNext = {
  candidate_id: 'candidate-1',
  status: 'pending',
  webhook_event_id: 'event-1',
  detected_plate: '01A777BA',
  camera_event_at: '2026-08-01T08:00:00.000Z',
  exit_images: {
    overview_url: '/api/events/event-1/exit-overview',
    vehicle_url: '/api/events/event-1/exit-vehicle',
    image_available: true,
  },
  matched_session: {
    session_id: 'session-1',
    plate_number: '01A777BA',
    session_source: 'regular',
    entered_at: '2026-08-01T07:00:00.000Z',
    entry_images: {
      overview_url: '/api/sessions/session-1/entry-overview',
      vehicle_url: '/api/sessions/session-1/entry-vehicle',
      image_available: true,
    },
    duration_minutes: 60,
    tariff_snapshot_amount: 12000,
  },
  pending_count_for_org: 1,
}

const searchResult: ExitCandidateSearchResult = {
  session_id: 'session-2',
  plate_number: '01B555BB',
  entered_at: '2026-08-01T06:30:00.000Z',
  session_source: 'regular',
  similarity_score: 87.5,
  entry_images: {
    overview_url: '/api/sessions/session-2/entry-overview',
    vehicle_url: null,
    image_available: true,
  },
  duration_minutes: 134,
  tariff_snapshot_amount: 15000,
}

const activeSession: ExitCandidateActiveSession = {
  session_id: 'session-3',
  plate_number: '01C333CC',
  entered_at: '2026-08-01T05:30:00.000Z',
  session_source: 'subscription',
  entry_images: {
    overview_url: '/api/sessions/session-3/entry-overview',
    vehicle_url: null,
    image_available: true,
  },
  duration_minutes: 180,
  tariff_snapshot_amount: 0,
}

function renderModal(value: ExitCandidateNext = candidate) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onClose = vi.fn()
  const onResolved = vi.fn()
  const onPendingRefresh = vi.fn()
  const onDataChanged = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitCandidateModal
          candidate={value}
          onClose={onClose}
          onResolved={onResolved}
          onPendingRefresh={onPendingRefresh}
          onDataChanged={onDataChanged}
        />
      </AntdApp>
    </QueryClientProvider>,
  )
  return { onClose, onResolved, onPendingRefresh, onDataChanged }
}

function selectCash() {
  fireEvent.click(screen.getByRole('radio', { name: 'Naqd' }))
}

describe('ExitCandidateModal', () => {
  beforeEach(() => {
    confirmExitCandidateMock.mockReset().mockResolvedValue({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'opened',
    })
    forceOpenExitCandidateMock.mockReset().mockResolvedValue({
      barrier_status: 'opened',
    })
    retryExitCandidateBarrierMock.mockReset().mockResolvedValue({
      barrier_status: 'opened',
    })
    searchExitCandidateMock.mockReset().mockResolvedValue({
      results: [searchResult],
      active_sessions: [activeSession],
    })
  })

  it('faqat kirish va chiqish avtomobil rasmlarini ko‘rsatadi', () => {
    renderModal()

    expect(screen.getByText('Kirish — avtomobil')).toBeInTheDocument()
    expect(screen.getByText('Chiqish — avtomobil')).toBeInTheDocument()
    expect(screen.getAllByTestId('authenticated-image')).toHaveLength(2)
    expect(screen.queryByText(/davlat raqami rasmi/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/plate/i)).not.toBeInTheDocument()
  })

  it('image_available false bo‘lsa xavfsiz bo‘sh holat ko‘rsatadi', () => {
    renderModal({
      ...candidate,
      exit_images: { ...candidate.exit_images, image_available: false },
      matched_session: {
        ...candidate.matched_session!,
        entry_images: {
          ...candidate.matched_session!.entry_images,
          image_available: false,
        },
      },
    })

    expect(screen.getAllByText('Rasm mavjud emas')).toHaveLength(2)
    expect(screen.queryByTestId('authenticated-image')).not.toBeInTheDocument()
  })

  it('confirm mutation davomida ikkinchi submitni bloklaydi', async () => {
    let resolveRequest!: (value: {
      session_id: string
      plate: string
      amount: number
      payment_method: 'cash'
      barrier_status: 'opened'
    }) => void
    confirmExitCandidateMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    renderModal()
    selectCash()
    const button = screen.getByRole('button', {
      name: 'Tasdiqlash va ochish',
    })

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledTimes(1),
    )
    expect(button).toBeDisabled()
    resolveRequest({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'opened',
    })
  })

  it('matched sessiya confirmida session_id yubormaydi', async () => {
    const { onResolved } = renderModal()
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        payment_method: 'cash',
      }),
    )
    await waitFor(() => expect(onResolved).toHaveBeenCalled())
  })

  it.each(['vip', 'subscription'] as const)(
    '%s sessiya uchun to‘lov tanlovini yashiradi va 0 so‘m ko‘rsatadi',
    (source) => {
      renderModal({
        ...candidate,
        matched_session: {
          ...candidate.matched_session!,
          session_source: source,
          tariff_snapshot_amount: 0,
        },
      })

      expect(screen.queryByRole('radio', { name: 'Naqd' })).not.toBeInTheDocument()
      expect(screen.queryByRole('radio', { name: 'Online' })).not.toBeInTheDocument()
      expect(screen.getByText('To‘lov talab qilinmaydi')).toBeInTheDocument()
      expect(screen.getAllByText("0 so'm").length).toBeGreaterThan(0)
    },
  )

  it('search natijasini tanlab confirmga faqat yangi session_id yuboradi', async () => {
    renderModal()
    fireEvent.click(
      screen.getByRole('button', { name: 'Boshqa sessiyani tanlash' }),
    )
    fireEvent.change(
      screen.getByPlaceholderText('Chiqayotgan mashina raqamini kiriting'),
      { target: { value: '01B555BB' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Qidirish' }))

    const resultCard = await screen.findByRole('button', { name: /01B555BB/ })
    fireEvent.click(resultCard)
    expect(screen.getByAltText('Kirish — avtomobil')).toHaveAttribute(
      'src',
      '/api/sessions/session-2/entry-overview',
    )
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        session_id: 'session-2',
        payment_method: 'cash',
      }),
    )
  })

  it('search natijasida davomiylik, taxminiy summa va foizni ko‘rsatadi', async () => {
    renderModal()
    fireEvent.click(
      screen.getByRole('button', { name: 'Boshqa sessiyani tanlash' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Qidirish' }))

    const resultCard = await screen.findByRole('button', { name: /01B555BB/ })
    expect(resultCard).toHaveTextContent('2 soat 14 daqiqa')
    expect(resultCard).toHaveTextContent("15 000 so'm")
    expect(resultCard).toHaveTextContent(
      '(yakuniy summa tasdiqlashda qayta hisoblanadi)',
    )
    expect(resultCard).toHaveTextContent('O‘xshashlik: 87.5%')

    fireEvent.click(resultCard)
    expect(screen.getByText('Summa')).toBeInTheDocument()
    expect(screen.getByText('2 soat 14 daqiqa')).toBeInTheDocument()
    expect(screen.getAllByText("15 000 so'm").length).toBeGreaterThan(0)
  })

  it('Barcha faol mashinalar tabida active_sessionsni ko‘rsatadi', async () => {
    renderModal()
    fireEvent.click(
      screen.getByRole('button', { name: 'Boshqa sessiyani tanlash' }),
    )
    fireEvent.click(screen.getByText('Barcha faol mashinalar'))

    expect(await screen.findByText('01C333CC')).toBeInTheDocument()
    expect(searchExitCandidateMock).toHaveBeenCalledWith(
      'candidate-1',
      undefined,
    )
  })

  it('Qidiruv va barcha faol mashinalar natijalarini bir vaqtda ko‘rsatmaydi', async () => {
    renderModal()
    fireEvent.click(
      screen.getByRole('button', { name: 'Boshqa sessiyani tanlash' }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Qidirish' }))
    expect(await screen.findByText('01B555BB')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Barcha faol mashinalar'))
    expect(await screen.findByText('01C333CC')).toBeInTheDocument()
    expect(screen.queryByText('01B555BB')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Qidiruv'))
    expect(screen.getByText('01B555BB')).toBeInTheDocument()
    expect(screen.queryByText('01C333CC')).not.toBeInTheDocument()
  })

  it('active_sessions tanlanganda confirmga session_id yuboradi', async () => {
    renderModal()
    fireEvent.click(
      screen.getByRole('button', { name: 'Boshqa sessiyani tanlash' }),
    )
    fireEvent.click(screen.getByText('Barcha faol mashinalar'))
    fireEvent.click(
      await screen.findByRole('button', { name: /01C333CC/ }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        session_id: 'session-3',
      }),
    )
  })

  it('matched session bo‘lmasa avtomatik search rejimini va tanlanmagan holatini ko‘rsatadi', () => {
    renderModal({ ...candidate, matched_session: null })

    expect(
      screen.getByPlaceholderText('Chiqayotgan mashina raqamini kiriting'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Mashina tanlanmagan').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    ).toBeDisabled()
  })

  it('detected_plate null bo‘lsa matched sessiya bilan xatosiz ochiladi', () => {
    expect(() =>
      renderModal({ ...candidate, detected_plate: null }),
    ).not.toThrow()
    expect(screen.getByText('01A777BA')).toBeInTheDocument()
  })

  it('detected_plate va matched_session null bo‘lsa search va force qiymatlari bo‘sh satr bo‘ladi', () => {
    expect(() =>
      renderModal({
        ...candidate,
        detected_plate: null,
        matched_session: null,
      }),
    ).not.toThrow()

    const searchInput = screen.getByPlaceholderText(
      'Chiqayotgan mashina raqamini kiriting',
    )
    expect(searchInput).toHaveValue('')
    expect(screen.getByText('Raqam aniqlanmadi')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Qidirish' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Majburiy ochish' }))
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByPlaceholderText('Izoh (ixtiyoriy)')).toHaveValue('')
  })

  it('force-open uchun other izohini validatsiya qiladi va payload yuboradi', async () => {
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Majburiy ochish' }))
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Boshqa'))

    const confirmButton = screen.getByRole('button', {
      name: 'Majburiy ochishni tasdiqlash',
    })
    expect(confirmButton).toBeDisabled()
    expect(
      screen.getByText('“Boshqa” sababi uchun izoh majburiy'),
    ).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Izoh (ixtiyoriy)'), {
      target: { value: 'Maxsus holat' },
    })
    fireEvent.click(confirmButton)

    await waitFor(() =>
      expect(forceOpenExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        reason: 'other',
        note: 'Maxsus holat',
      }),
    )
  })

  it('barrier failed bo‘lsa retry tugmasini ko‘rsatadi va qayta ochadi', async () => {
    confirmExitCandidateMock.mockResolvedValue({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'failed',
    })
    const { onResolved } = renderModal()
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )

    const retryButton = await screen.findByRole('button', {
      name: 'Qayta ochish',
    })
    fireEvent.click(retryButton)

    await waitFor(() =>
      expect(retryExitCandidateBarrierMock).toHaveBeenCalledWith('candidate-1'),
    )
    expect(await screen.findByText('Shlagbaum ochildi')).toBeInTheDocument()
    expect(onResolved).toHaveBeenCalled()
  })

  it('force-open barrier failed bo‘lsa retry tugmasini ko‘rsatadi', async () => {
    forceOpenExitCandidateMock.mockResolvedValue({ barrier_status: 'failed' })
    renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Majburiy ochish' }))
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('Favqulodda holat'))
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Majburiy ochishni tasdiqlash',
      }),
    )

    expect(
      await screen.findByRole('button', { name: 'Qayta ochish' }),
    ).toBeInTheDocument()
  })

  it.each(['disabled', 'not_configured'] as const)(
    'barrier %s bo‘lsa retry ko‘rsatmaydi va administrator xabarini chiqaradi',
    async (barrierStatus) => {
      confirmExitCandidateMock.mockResolvedValue({
        session_id: 'session-1',
        plate: '01A777BA',
        amount: 12000,
        payment_method: 'cash',
        barrier_status: barrierStatus,
      })
      const { onResolved } = renderModal()
      selectCash()
      fireEvent.click(
        screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
      )

      expect(
        await screen.findByText(
          'To‘lov saqlandi, lekin shlagbaum konfiguratsiya qilinmagan. Administrator bilan bog‘laning',
        ),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Qayta ochish' }),
      ).not.toBeInTheDocument()
      expect(onResolved).not.toHaveBeenCalled()
    },
  )

  it('retry failed bo‘lsa retry tugmasini ko‘rsatishda davom etadi', async () => {
    confirmExitCandidateMock.mockResolvedValue({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'failed',
    })
    retryExitCandidateBarrierMock.mockResolvedValue({
      barrier_status: 'failed',
    })
    renderModal()
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Qayta ochish' }))

    expect(
      await screen.findByRole('button', { name: 'Qayta ochish' }),
    ).toBeInTheDocument()
  })

  it('retry not_configured bo‘lsa retry tugmasini yashiradi', async () => {
    confirmExitCandidateMock.mockResolvedValue({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'failed',
    })
    retryExitCandidateBarrierMock.mockResolvedValue({
      barrier_status: 'not_configured',
    })
    renderModal()
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Qayta ochish' }))

    expect(
      await screen.findByText(
        'To‘lov saqlandi, lekin shlagbaum konfiguratsiya qilinmagan. Administrator bilan bog‘laning',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Qayta ochish' }),
    ).not.toBeInTheDocument()
  })

  it('retry 400 bo‘lsa backend errorini ko‘rsatadi va tugmani yashiradi', async () => {
    confirmExitCandidateMock.mockResolvedValue({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'failed',
    })
    retryExitCandidateBarrierMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Shlagbaum konfiguratsiya qilinmagan' },
      },
    })
    renderModal()
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Qayta ochish' }))

    expect(
      await screen.findByText('Shlagbaum konfiguratsiya qilinmagan'),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Qayta ochish' }),
      ).not.toBeInTheDocument(),
    )
  })

  it('409 bo‘lsa xabar ko‘rsatadi va modalni queue callback orqali yopadi', async () => {
    confirmExitCandidateMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: 'resolved' } },
    })
    const { onResolved, onPendingRefresh } = renderModal()
    selectCash()
    fireEvent.click(
      screen.getByRole('button', { name: 'Tasdiqlash va ochish' }),
    )

    expect(
      await screen.findByText(
        'Bu chiqish allaqachon boshqa operator tomonidan hal qilingan',
      ),
    ).toBeInTheDocument()
    expect(onPendingRefresh).not.toHaveBeenCalled()
    expect(onResolved).toHaveBeenCalled()
  })
})
