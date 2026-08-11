import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp } from 'antd'
import ExitCandidateModal from './ExitCandidateModal'
import type * as ExitCandidatesApi from '@/api/exitCandidates'
import type {
  ExitCandidateActiveSession,
  ExitCandidateBarrierResponse,
  ExitCandidateConfirmResponse,
  ExitCandidateNext,
  ExitCandidateSearchResult,
} from '@/types/exitCandidate'

const {
  confirmExitCandidateMock,
  forceOpenExitCandidateMock,
  retryExitCandidateBarrierMock,
  searchExitCandidateMock,
} = vi.hoisted(() => ({
  confirmExitCandidateMock:
    vi.fn<typeof ExitCandidatesApi.confirmExitCandidate>(),
  forceOpenExitCandidateMock:
    vi.fn<typeof ExitCandidatesApi.forceOpenExitCandidate>(),
  retryExitCandidateBarrierMock:
    vi.fn<typeof ExitCandidatesApi.retryExitCandidateBarrier>(),
  searchExitCandidateMock:
    vi.fn<typeof ExitCandidatesApi.searchExitCandidate>(),
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

const unmatchedCandidate: ExitCandidateNext = {
  ...candidate,
  detected_plate: null,
  matched_session: null,
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

interface TestQueries {
  getAllByTestId: (id: string) => HTMLElement[]
  getAllByText: (text: string | RegExp) => HTMLElement[]
  getByAltText: (text: string | RegExp) => HTMLElement
  getByPlaceholderText: (text: string | RegExp) => HTMLElement
  getByRole: (
    role: string,
    options?: { name?: string | RegExp },
  ) => HTMLElement
  getByTestId: (id: string) => HTMLElement
  getByText: (text: string | RegExp) => HTMLElement
  queryByRole: (
    role: string,
    options?: { name?: string | RegExp },
  ) => HTMLElement | null
  queryByTestId: (id: string) => HTMLElement | null
  queryByText: (text: string | RegExp) => HTMLElement | null
}

const page = screen as unknown as TestQueries
const scope = within as unknown as (element: HTMLElement) => TestQueries

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

function renderModalHost() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onResolved = vi.fn()
  const onDataChanged = vi.fn()
  const tree = (mounted: boolean) => (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        {mounted && (
          <ExitCandidateModal
            candidate={candidate}
            onClose={vi.fn()}
            onResolved={onResolved}
            onPendingRefresh={vi.fn()}
            onDataChanged={onDataChanged}
          />
        )}
      </AntdApp>
    </QueryClientProvider>
  )
  const view = render(tree(true))
  return {
    onResolved,
    onDataChanged,
    unmountModal: () => view.rerender(tree(false)),
  }
}

function queryButtonByText(label: string): HTMLButtonElement | null {
  return (
    Array.from(
      document.querySelectorAll<HTMLButtonElement>('button'),
    ).find((element) => element.textContent?.trim() === label) ?? null
  )
}

function getButtonByText(label: string): HTMLButtonElement {
  const button = queryButtonByText(label)
  if (!button) throw new Error(`Button not found: ${label}`)
  return button
}

function clickButton(label: string): void {
  const button = getButtonByText(label)
  fireEvent.click(button)
}

function clickText(text: string): void {
  const element = page.getByText(text)
  fireEvent.click(element)
}

function selectCash(): void {
  const radio = page.getByRole('radio', { name: 'Naqd' })
  fireEvent.click(radio)
}

async function waitForText(text: string): Promise<void> {
  await waitFor(() => {
    expect(document.body).toHaveTextContent(text)
  })
}

async function waitForButton(label: string): Promise<HTMLButtonElement> {
  let button: HTMLButtonElement | null = null
  await waitFor(() => {
    button = queryButtonByText(label)
    if (!button) throw new Error(`Button not found: ${label}`)
  })
  if (!button) throw new Error(`Button not found: ${label}`)
  return button
}

describe('ExitCandidateModal', () => {
  beforeEach(() => {
    confirmExitCandidateMock.mockReset()
    confirmExitCandidateMock.mockResolvedValue({
      session_id: 'session-1',
      plate: '01A777BA',
      amount: 12000,
      payment_method: 'cash',
      barrier_status: 'opened',
    })
    forceOpenExitCandidateMock.mockReset()
    forceOpenExitCandidateMock.mockResolvedValue({
      barrier_status: 'opened',
    })
    retryExitCandidateBarrierMock.mockReset()
    retryExitCandidateBarrierMock.mockResolvedValue({
      barrier_status: 'opened',
    })
    searchExitCandidateMock.mockReset()
    searchExitCandidateMock.mockResolvedValue({
      results: [searchResult],
      active_sessions: [activeSession],
    })
  })

  it('faqat kirish va chiqish avtomobil rasmlarini ko‘rsatadi', () => {
    renderModal()

    const entryTitle = page.getByText('Kirish — avtomobil')
    const exitTitle = page.getByText('Chiqish — avtomobil')
    const images = page.getAllByTestId('authenticated-image')
    const plateImageLabel = page.queryByText(/davlat raqami rasmi/i)
    const rawPlateLabel = page.queryByText(/plate/i)
    expect(entryTitle).toBeInTheDocument()
    expect(exitTitle).toBeInTheDocument()
    expect(images).toHaveLength(2)
    expect(plateImageLabel).not.toBeInTheDocument()
    expect(rawPlateLabel).not.toBeInTheDocument()
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

    const emptyStates = page.getAllByText('Rasm mavjud emas')
    const image = page.queryByTestId('authenticated-image')
    expect(emptyStates).toHaveLength(2)
    expect(image).not.toBeInTheDocument()
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
    const button = page.getByRole('button', {
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
    clickButton('Tasdiqlash va ochish')

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        payment_method: 'cash',
      }),
    )
    await waitFor(() => expect(onResolved).toHaveBeenCalled())
  })

  it('Naqd va Online tanlovini mashina ma’lumotlari ustunida ko‘rsatadi', () => {
    renderModal()

    const vehicleDetails = page.getByTestId(
      'exit-candidate-vehicle-details',
    )
    const qrColumn = page.getByTestId('exit-candidate-qr-column')
    const cashRadio = scope(vehicleDetails).getByRole('radio', {
      name: 'Naqd',
    })
    const onlineRadio = scope(vehicleDetails).getByRole('radio', {
      name: 'Online',
    })
    const qrRadio = scope(qrColumn).queryByRole('radio')
    expect(cashRadio).toBeInTheDocument()
    expect(onlineRadio).toBeInTheDocument()
    expect(qrRadio).not.toBeInTheDocument()
  })

  it('yakuniy summani chap ustunda faqat bir marta ko‘rsatadi', () => {
    renderModal()

    const vehicleDetails = page.getByTestId(
      'exit-candidate-vehicle-details',
    )
    const amount = scope(vehicleDetails).getByText("12 000 so'm")
    const amounts = page.getAllByText("12 000 so'm")
    expect(amount).toBeInTheDocument()
    expect(amounts).toHaveLength(1)
  })

  it('o‘ng ustunda faqat QR kodini ko‘rsatadi', () => {
    renderModal()

    const qrColumn = page.getByTestId('exit-candidate-qr-column')
    const qrImage = scope(qrColumn).getByAltText('To‘lov QR kodi')
    const button = scope(qrColumn).queryByRole('button')
    const radio = scope(qrColumn).queryByRole('radio')
    expect(qrImage).toHaveAttribute('loading', 'lazy')
    expect(qrColumn).toHaveTextContent('')
    expect(button).not.toBeInTheDocument()
    expect(radio).not.toBeInTheDocument()
  })

  it.each(['vip', 'subscription'] as const)(
    '%s sessiya uchun to‘lov tanlovini yashiradi va summani chapda ko‘rsatadi',
    (source) => {
      renderModal({
        ...candidate,
        matched_session: {
          ...candidate.matched_session!,
          session_source: source,
          tariff_snapshot_amount: 0,
        },
      })

      const cashRadio = page.queryByRole('radio', { name: 'Naqd' })
      const onlineRadio = page.queryByRole('radio', { name: 'Online' })
      const amounts = page.getAllByText("0 so'm")
      const vehicleDetails = page.getByTestId(
        'exit-candidate-vehicle-details',
      )
      const qrColumn = page.getByTestId('exit-candidate-qr-column')
      const amount = scope(vehicleDetails).getByText("0 so'm")
      const qrImage = scope(qrColumn).getByAltText('To‘lov QR kodi')
      expect(cashRadio).not.toBeInTheDocument()
      expect(onlineRadio).not.toBeInTheDocument()
      expect(amounts).toHaveLength(1)
      expect(amount).toBeInTheDocument()
      expect(qrImage).toBeInTheDocument()
    },
  )

  it('search natijasini tanlab confirmga faqat yangi session_id yuboradi', async () => {
    renderModal()
    clickButton('Boshqa sessiyani tanlash')
    const searchInput = page.getByPlaceholderText(
      'Chiqayotgan mashina raqamini kiriting',
    )
    fireEvent.change(
      searchInput,
      { target: { value: '01B555BB' } },
    )
    clickButton('Qidirish')

    await waitForText('01B555BB')
    const resultCard = page.getByRole('button', { name: /01B555BB/ })
    fireEvent.click(resultCard)
    const entryImage = page.getByAltText('Kirish — avtomobil')
    expect(entryImage).toHaveAttribute(
      'src',
      '/api/sessions/session-2/entry-overview',
    )
    selectCash()
    clickButton('Tasdiqlash va ochish')

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        session_id: 'session-2',
        payment_method: 'cash',
      }),
    )
  })

  it('search natijasida davomiylik, taxminiy summa va foizni ko‘rsatadi', async () => {
    renderModal()
    clickButton('Boshqa sessiyani tanlash')
    clickButton('Qidirish')

    await waitForText('01B555BB')
    const resultCard = page.getByRole('button', { name: /01B555BB/ })
    expect(resultCard).toHaveTextContent('2 soat 14 daqiqa')
    expect(resultCard).toHaveTextContent("15 000 so'm")
    expect(resultCard).toHaveTextContent(
      '(yakuniy summa tasdiqlashda qayta hisoblanadi)',
    )
    expect(resultCard).toHaveTextContent('O‘xshashlik: 87.5%')

    fireEvent.click(resultCard)
    const amountLabel = page.getByText('Summa')
    const duration = page.getByText('2 soat 14 daqiqa')
    const amounts = page.getAllByText("15 000 so'm")
    expect(amountLabel).toBeInTheDocument()
    expect(duration).toBeInTheDocument()
    expect(amounts.length).toBeGreaterThan(0)
  })

  it('Barcha faol mashinalar tabida active_sessionsni ko‘rsatadi', async () => {
    renderModal()
    clickButton('Boshqa sessiyani tanlash')
    clickText('Barcha faol mashinalar')

    await waitForText('01C333CC')
    expect(searchExitCandidateMock).toHaveBeenCalledWith(
      'candidate-1',
      undefined,
    )
  })

  it('Qidiruv va barcha faol mashinalar natijalarini bir vaqtda ko‘rsatmaydi', async () => {
    renderModal()
    clickButton('Boshqa sessiyani tanlash')
    clickButton('Qidirish')
    await waitForText('01B555BB')

    clickText('Barcha faol mashinalar')
    await waitForText('01C333CC')
    const hiddenSearchResult = page.queryByText('01B555BB')
    expect(hiddenSearchResult).not.toBeInTheDocument()

    clickText('Qidiruv')
    const searchResultItem = page.getByText('01B555BB')
    const hiddenActiveSession = page.queryByText('01C333CC')
    expect(searchResultItem).toBeInTheDocument()
    expect(hiddenActiveSession).not.toBeInTheDocument()
  })

  it('active_sessions tanlanganda confirmga session_id yuboradi', async () => {
    renderModal()
    clickButton('Boshqa sessiyani tanlash')
    clickText('Barcha faol mashinalar')
    await waitForText('01C333CC')
    const activeSessionButton = page.getByRole('button', {
      name: /01C333CC/,
    })
    fireEvent.click(activeSessionButton)
    clickButton('Tasdiqlash va ochish')

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        session_id: 'session-3',
      }),
    )
  })

  it('matched session bo‘lmasa avtomatik search rejimini va tanlanmagan holatini ko‘rsatadi', () => {
    renderModal({ ...candidate, matched_session: null })

    const searchInput = page.getByPlaceholderText(
      'Chiqayotgan mashina raqamini kiriting',
    )
    const emptyStates = page.getAllByText('Mashina tanlanmagan')
    const confirmButton = getButtonByText('Tasdiqlash va ochish')
    expect(searchInput).toBeInTheDocument()
    expect(emptyStates.length).toBeGreaterThan(0)
    expect(confirmButton).toBeDisabled()
  })

  it('detected_plate null bo‘lsa matched sessiya bilan xatosiz ochiladi', () => {
    renderModal({ ...candidate, detected_plate: null })
    const plate = page.getByText('01A777BA')
    expect(plate).toBeInTheDocument()
  })

  it('detected_plate va matched_session null bo‘lsa search qiymati bo‘sh satr bo‘ladi', () => {
    renderModal({
      ...candidate,
      detected_plate: null,
      matched_session: null,
    })

    const searchInput = page.getByPlaceholderText(
      'Chiqayotgan mashina raqamini kiriting',
    )
    const plateNotDetected = page.getByText('Raqam aniqlanmadi')
    const searchButton = getButtonByText('Qidirish')
    expect(searchInput).toHaveValue('')
    expect(plateNotDetected).toBeInTheDocument()
    expect(searchButton).toBeDisabled()
  })

  it('Majburiy ochish bosilganda formasiz darhol bodysiz API chaqiradi', async () => {
    renderModal(unmatchedCandidate)
    clickButton('Majburiy ochish')

    await waitFor(() =>
      expect(forceOpenExitCandidateMock).toHaveBeenCalledWith('candidate-1'),
    )
    expect(page.queryByText('Sababni tanlang')).not.toBeInTheDocument()
    expect(page.queryByText('Izoh (ixtiyoriy)')).not.toBeInTheDocument()
    expect(
      page.queryByRole('button', {
        name: 'Majburiy ochishni tasdiqlash',
      }),
    ).not.toBeInTheDocument()
  })

  it('Majburiy ochish so‘rovi davomida double-submitni bloklaydi', async () => {
    let resolveRequest!: (value: ExitCandidateBarrierResponse) => void
    forceOpenExitCandidateMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    renderModal(unmatchedCandidate)
    const button = getButtonByText('Majburiy ochish')

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() =>
      expect(forceOpenExitCandidateMock).toHaveBeenCalledTimes(1),
    )
    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveClass('ant-btn-loading')
    resolveRequest({ barrier_status: 'opened' })
  })

  it('Majburiy ochish muvaffaqiyatli bo‘lganda modalni yopish va ro‘yxatni yangilash callbackini chaqiradi', async () => {
    const { onResolved } = renderModal(unmatchedCandidate)

    clickButton('Majburiy ochish')

    await waitFor(() => expect(onResolved).toHaveBeenCalledTimes(1))
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
    clickButton('Tasdiqlash va ochish')

    const retryButton = await waitForButton('Qayta ochish')
    fireEvent.click(retryButton)

    await waitFor(() =>
      expect(retryExitCandidateBarrierMock).toHaveBeenCalledWith('candidate-1'),
    )
    await waitForText('Shlagbaum ochildi')
    expect(onResolved).toHaveBeenCalled()
  })

  it('force-open barrier failed bo‘lsa retry tugmasini ko‘rsatadi', async () => {
    forceOpenExitCandidateMock.mockResolvedValue({ barrier_status: 'failed' })
    renderModal(unmatchedCandidate)
    clickButton('Majburiy ochish')

    await waitForButton('Qayta ochish')
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
      clickButton('Tasdiqlash va ochish')

      await waitForText(
        'To‘lov saqlandi, lekin shlagbaum konfiguratsiya qilinmagan. Administrator bilan bog‘laning',
      )
      const retryButton = queryButtonByText('Qayta ochish')
      expect(retryButton).not.toBeInTheDocument()
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
    clickButton('Tasdiqlash va ochish')
    const retryButton = await waitForButton('Qayta ochish')
    fireEvent.click(retryButton)

    await waitForButton('Qayta ochish')
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
    clickButton('Tasdiqlash va ochish')
    const retryButton = await waitForButton('Qayta ochish')
    fireEvent.click(retryButton)

    await waitForText(
      'To‘lov saqlandi, lekin shlagbaum konfiguratsiya qilinmagan. Administrator bilan bog‘laning',
    )
    const hiddenRetryButton = queryButtonByText('Qayta ochish')
    expect(hiddenRetryButton).not.toBeInTheDocument()
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
    clickButton('Tasdiqlash va ochish')
    const retryButton = await waitForButton('Qayta ochish')
    fireEvent.click(retryButton)

    await waitForText('Shlagbaum konfiguratsiya qilinmagan')
    await waitFor(() => {
      const hiddenRetryButton = queryButtonByText('Qayta ochish')
      expect(hiddenRetryButton).not.toBeInTheDocument()
    })
  })

  it('409 bo‘lsa xabar ko‘rsatadi va modalni queue callback orqali yopadi', async () => {
    confirmExitCandidateMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { error: 'resolved' } },
    })
    const { onResolved, onPendingRefresh } = renderModal()
    selectCash()
    clickButton('Tasdiqlash va ochish')

    await waitForText(
      'Bu chiqish allaqachon boshqa operator tomonidan hal qilingan',
    )
    expect(onPendingRefresh).not.toHaveBeenCalled()
    expect(onResolved).toHaveBeenCalled()
  })

  it('modal yopilgandan keyin kelgan confirm javobi e‘tiborsiz qoldiriladi', async () => {
    let resolveConfirm: ((value: ExitCandidateConfirmResponse) => void) | null =
      null
    confirmExitCandidateMock.mockImplementation(
      () =>
        new Promise<ExitCandidateConfirmResponse>((resolve) => {
          resolveConfirm = resolve
        }),
    )
    const { onResolved, onDataChanged, unmountModal } = renderModalHost()
    selectCash()
    clickButton('Tasdiqlash va ochish')
    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledTimes(1),
    )

    unmountModal()
    expect(queryButtonByText('Tasdiqlash va ochish')).toBeNull()

    await act(async () => {
      resolveConfirm?.({
        session_id: 'session-1',
        plate: '01A777BA',
        amount: 12000,
        payment_method: 'cash',
        barrier_status: 'opened',
      })
      await Promise.resolve()
    })

    expect(onResolved).not.toHaveBeenCalled()
    expect(onDataChanged).not.toHaveBeenCalled()
    expect(document.body).not.toHaveTextContent(
      'Chiqish tasdiqlandi va shlagbaum ochildi',
    )
  })

  it('modal yopilgandan keyin kelgan confirm xatosi ko‘rsatilmaydi', async () => {
    let rejectConfirm: ((reason: unknown) => void) | null = null
    confirmExitCandidateMock.mockImplementation(
      () =>
        new Promise<ExitCandidateConfirmResponse>((_resolve, reject) => {
          rejectConfirm = reject
        }),
    )
    const { onResolved, unmountModal } = renderModalHost()
    selectCash()
    clickButton('Tasdiqlash va ochish')
    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledTimes(1),
    )

    unmountModal()

    await act(async () => {
      rejectConfirm?.(
        Object.assign(new Error('conflict'), {
          isAxiosError: true,
          response: { status: 409, data: {} },
        }),
      )
      await Promise.resolve()
    })

    expect(onResolved).not.toHaveBeenCalled()
    expect(document.body).not.toHaveTextContent(
      'Bu chiqish allaqachon boshqa operator tomonidan hal qilingan',
    )
    expect(document.body).not.toHaveTextContent('Chiqishni tasdiqlab bo‘lmadi')
  })

  it('matched_session_id mavjud boʻlsa Majburiy ochish koʻrsatilmaydi', () => {
    renderModal({
      ...unmatchedCandidate,
      matched_session_id: 501,
    })

    expect(queryButtonByText('Majburiy ochish')).toBeNull()
    expect(getButtonByText('Boshqa sessiyani tanlash')).toBeInTheDocument()
  })

  it('resolved_session_id orqali bogʻlansa Majburiy ochish yashiriladi', () => {
    renderModal({
      ...unmatchedCandidate,
      resolved_session_id: 777,
    })

    expect(queryButtonByText('Majburiy ochish')).toBeNull()
  })

  it('matched_session obyekti mavjud boʻlsa ham Majburiy ochish yashiriladi', () => {
    renderModal()

    expect(queryButtonByText('Majburiy ochish')).toBeNull()
  })

  it('sessiya bogʻlanmagan boʻlsa Majburiy ochish koʻrsatiladi', () => {
    renderModal(unmatchedCandidate)

    expect(getButtonByText('Majburiy ochish')).toBeInTheDocument()
  })
})
