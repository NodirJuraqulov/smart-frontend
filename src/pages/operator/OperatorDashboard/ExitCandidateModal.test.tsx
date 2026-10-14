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
  previewExitSessionMock,
  retryExitCandidateBarrierMock,
  searchExitCandidateMock,
} = vi.hoisted(() => ({
  confirmExitCandidateMock:
    vi.fn<typeof ExitCandidatesApi.confirmExitCandidate>(),
  forceOpenExitCandidateMock:
    vi.fn<typeof ExitCandidatesApi.forceOpenExitCandidate>(),
  previewExitSessionMock:
    vi.fn<typeof ExitCandidatesApi.previewExitSession>(),
  retryExitCandidateBarrierMock:
    vi.fn<typeof ExitCandidatesApi.retryExitCandidateBarrier>(),
  searchExitCandidateMock:
    vi.fn<typeof ExitCandidatesApi.searchExitCandidate>(),
}))

vi.mock('@/api/exitCandidates', () => ({
  confirmExitCandidate: confirmExitCandidateMock,
  forceOpenExitCandidate: forceOpenExitCandidateMock,
  previewExitSession: previewExitSessionMock,
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

const detectedUnmatchedCandidate: ExitCandidateNext = {
  ...candidate,
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
  const tree = (currentCandidate: ExitCandidateNext) => (
    <QueryClientProvider client={queryClient}>
      <AntdApp>
        <ExitCandidateModal
          candidate={currentCandidate}
          onClose={onClose}
          onResolved={onResolved}
          onPendingRefresh={onPendingRefresh}
          onDataChanged={onDataChanged}
        />
      </AntdApp>
    </QueryClientProvider>
  )
  const view = render(tree(value))
  return {
    onClose,
    onResolved,
    onPendingRefresh,
    onDataChanged,
    rerenderCandidate: (nextCandidate: ExitCandidateNext) =>
      view.rerender(tree(nextCandidate)),
  }
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

function selectOnline(): void {
  const radio = page.getByRole('radio', { name: 'Online' })
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

function useEmptySearchResults(): void {
  searchExitCandidateMock.mockResolvedValue({
    results: [],
    active_sessions: [],
  })
}

async function runPlateSearch(plate?: string): Promise<void> {
  let input = screen.queryByPlaceholderText(
    'Chiqayotgan mashina raqamini kiriting',
  )
  if (!input) {
    clickText('Qidiruv')
    input = page.getByPlaceholderText(
      'Chiqayotgan mashina raqamini kiriting',
    )
  }
  if (plate !== undefined) {
    fireEvent.change(input, { target: { value: plate } })
  }
  const previousCallCount = searchExitCandidateMock.mock.calls.length
  clickButton('Qidirish')
  await waitFor(() =>
    expect(searchExitCandidateMock).toHaveBeenCalledTimes(
      previousCallCount + 1,
    ),
  )
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
    previewExitSessionMock.mockReset()
    previewExitSessionMock.mockResolvedValue({})
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

  it('Online tanlanganda confirmga online payment_method yuboradi', async () => {
    renderModal()
    selectOnline()
    clickButton('Tasdiqlash va ochish')

    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        payment_method: 'online',
      }),
    )
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

  it('matched sessiyada Naqd va Online qoladi, Tez yordam actioni ko‘rsatilmaydi', () => {
    renderModal()

    const vehicleDetails = page.getByTestId(
      'exit-candidate-vehicle-details',
    )
    expect(
      scope(vehicleDetails).getByRole('radio', { name: 'Naqd' }),
    ).toBeInTheDocument()
    expect(
      scope(vehicleDetails).getByRole('radio', { name: 'Online' }),
    ).toBeInTheDocument()
    expect(
      scope(vehicleDetails).queryByRole('button', { name: 'Tez yordam' }),
    ).not.toBeInTheDocument()
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
    expect(previewExitSessionMock).toHaveBeenCalledWith({
      candidateId: 'candidate-1',
      sessionId: 'session-2',
    })
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

  it('preview xatosida tanlovni saqlaydi va modal oqimini davom ettiradi', async () => {
    const error = new Error('preview failed')
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    previewExitSessionMock.mockRejectedValue(error)

    try {
      renderModal()
      clickButton('Boshqa sessiyani tanlash')
      clickButton('Qidirish')

      await waitForText('01B555BB')
      fireEvent.click(page.getByRole('button', { name: /01B555BB/ }))

      await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith(error))
      expect(page.getByText('01B555BB')).toBeInTheDocument()
      selectCash()
      expect(getButtonByText('Tasdiqlash va ochish')).toBeEnabled()
    } finally {
      consoleErrorSpy.mockRestore()
    }
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

  it('matched session bo‘lmasa aniqlangan raqam bilan avtomatik qidiradi va natijani ko‘rsatadi', async () => {
    renderModal(detectedUnmatchedCandidate)

    await waitFor(() =>
      expect(searchExitCandidateMock).toHaveBeenCalledWith(
        'candidate-1',
        '01A777BA',
      ),
    )
    await waitForText('01B555BB')
    expect(page.getByText('01B555BB')).toBeInTheDocument()
  })

  it('matched session bo‘lsa avtomatik qidiruv qilmaydi', async () => {
    renderModal()

    await act(async () => Promise.resolve())
    expect(searchExitCandidateMock).not.toHaveBeenCalled()
  })

  it.each([null, 'A'])(
    'aniqlangan raqam %s bo‘lsa bodysiz avtomatik qidirib active_sessionsni ko‘rsatadi',
    async (detectedPlate) => {
      renderModal({
        ...unmatchedCandidate,
        detected_plate: detectedPlate,
      })

      await waitFor(() =>
        expect(searchExitCandidateMock).toHaveBeenCalledWith(
          'candidate-1',
          undefined,
        ),
      )
      await waitForText('01C333CC')
      expect(page.getByText('01C333CC')).toBeInTheDocument()
    },
  )

  it('avtomatik qidiruv xatosi modalni bloklamaydi va xabar chiqarmaydi', async () => {
    searchExitCandidateMock.mockRejectedValue(new Error('network failed'))
    renderModal(detectedUnmatchedCandidate)

    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))
    expect(
      page.getByPlaceholderText('Chiqayotgan mashina raqamini kiriting'),
    ).toBeInTheDocument()
    expect(page.queryByText('Sessiyalarni qidirib bo‘lmadi')).not.toBeInTheDocument()
  })

  it('nomersiz avtomatik qidiruv xatosidan keyin qo‘lda qidiruvga qaytadi', async () => {
    searchExitCandidateMock.mockRejectedValue(new Error('network failed'))
    renderModal(unmatchedCandidate)

    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))
    expect(
      await screen.findByPlaceholderText(
        'Chiqayotgan mashina raqamini kiriting',
      ),
    ).toBeInTheDocument()
  })

  it('kech kelgan eski avtomatik javob yangi qo‘lda qidiruv natijasini bosmaydi', async () => {
    let resolveAutoSearch!: (value: {
      results: ExitCandidateSearchResult[]
      active_sessions: ExitCandidateActiveSession[]
    }) => void
    const latestResult: ExitCandidateSearchResult = {
      ...searchResult,
      session_id: 'session-4',
      plate_number: '01D222DD',
    }
    searchExitCandidateMock
      .mockReset()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAutoSearch = resolve
          }),
      )
      .mockResolvedValueOnce({ results: [], active_sessions: [activeSession] })
      .mockResolvedValueOnce({ results: [latestResult], active_sessions: [] })

    renderModal(detectedUnmatchedCandidate)
    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))
    clickText('Barcha faol mashinalar')
    await waitForText('01C333CC')
    clickText('Qidiruv')
    await runPlateSearch('01D222DD')
    await waitForText('01D222DD')

    resolveAutoSearch({ results: [searchResult], active_sessions: [] })
    await act(async () => Promise.resolve())

    expect(page.getByText('01D222DD')).toBeInTheDocument()
    expect(page.queryByText('01B555BB')).not.toBeInTheDocument()
  })

  it('bir candidate qayta render bo‘lganda avtomatik qidiruvni takrorlamaydi', async () => {
    const { rerenderCandidate } = renderModal(detectedUnmatchedCandidate)
    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))

    rerenderCandidate({ ...detectedUnmatchedCandidate })

    await act(async () => Promise.resolve())
    expect(searchExitCandidateMock).toHaveBeenCalledTimes(1)
    expect(page.getByText('01B555BB')).toBeInTheDocument()
  })

  it('avtomatik qidiruvdan keyin qo‘lda boshqa raqamni qidirish ishlaydi', async () => {
    renderModal(detectedUnmatchedCandidate)
    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))

    await runPlateSearch('01D222DD')

    expect(searchExitCandidateMock).toHaveBeenLastCalledWith(
      'candidate-1',
      '01D222DD',
    )
  })

  it('similarity maydoni bo‘lmasa natijani foizsiz ko‘rsatadi', async () => {
    searchExitCandidateMock.mockResolvedValue({
      results: [{ ...searchResult, similarity_score: undefined }],
      active_sessions: [],
    })
    renderModal(detectedUnmatchedCandidate)

    await waitForText('01B555BB')
    expect(page.getByText('01B555BB')).toBeInTheDocument()
    expect(page.queryByText(/O‘xshashlik:/)).not.toBeInTheDocument()
  })

  it('detected_plate null bo‘lsa matched sessiya bilan xatosiz ochiladi', () => {
    renderModal({ ...candidate, detected_plate: null })
    const plate = page.getByText('01A777BA')
    expect(plate).toBeInTheDocument()
  })

  it('detected_plate va matched_session null bo‘lsa manual search qiymati bo‘sh satr bo‘ladi', async () => {
    renderModal({
      ...candidate,
      detected_plate: null,
      matched_session: null,
    })

    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))
    clickText('Qidiruv')

    const searchInput = page.getByPlaceholderText(
      'Chiqayotgan mashina raqamini kiriting',
    )
    const plateNotDetected = page.getByText('Raqam aniqlanmadi')
    const searchButton = getButtonByText('Qidirish')
    expect(searchInput).toHaveValue('')
    expect(plateNotDetected).toBeInTheDocument()
    expect(searchButton).toBeDisabled()
  })

  it('qidiruv kutilayotganda Majburiy ochish faol bo‘ladi', async () => {
    let resolveSearch!: (value: {
      results: ExitCandidateSearchResult[]
      active_sessions: ExitCandidateActiveSession[]
    }) => void
    searchExitCandidateMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve
      }),
    )
    renderModal(detectedUnmatchedCandidate)
    const forceButton = getButtonByText('Majburiy ochish')

    expect(forceButton).toBeEnabled()
    resolveSearch({ results: [searchResult], active_sessions: [activeSession] })
  })

  it('qidiruv xato bergandan keyin Majburiy ochish faol bo‘ladi', async () => {
    searchExitCandidateMock.mockRejectedValue(new Error('network failed'))
    renderModal(detectedUnmatchedCandidate)
    const forceButton = getButtonByText('Majburiy ochish')

    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(forceButton).toBeEnabled())
  })

  it('bo‘sh avtomatik qidiruv ham Majburiy ochishni faollashtiradi', async () => {
    useEmptySearchResults()
    renderModal(detectedUnmatchedCandidate)
    const forceButton = getButtonByText('Majburiy ochish')

    await waitFor(() => expect(forceButton).toBeEnabled())
    fireEvent.click(forceButton)

    await waitFor(() =>
      expect(forceOpenExitCandidateMock).toHaveBeenCalledWith('candidate-1'),
    )
    expect(
      page.queryByText("Iltimos, raqamni to'g'irlab, yana qidiruv qiling"),
    ).not.toBeInTheDocument()
  })

  it('avtomatik qidiruvda natija bo‘lsa Majburiy ochish faol bo‘ladi', async () => {
    renderModal(detectedUnmatchedCandidate)
    const forceButton = getButtonByText('Majburiy ochish')

    await waitForText('01B555BB')
    expect(forceButton).toBeEnabled()
  })

  it('candidate pending bo‘lmasa Majburiy ochish nofaol bo‘ladi', async () => {
    renderModal({
      ...detectedUnmatchedCandidate,
      status: 'accepted',
    } as unknown as ExitCandidateNext)
    const forceButton = getButtonByText('Majburiy ochish')

    await waitForText('01B555BB')
    expect(forceButton).toBeDisabled()
  })

  it('nomersiz avtomatik qidiruvdan keyin Majburiy ochish ishlaydi', async () => {
    renderModal(unmatchedCandidate)
    const forceButton = getButtonByText('Majburiy ochish')

    await waitFor(() => expect(forceButton).toBeEnabled())
    fireEvent.click(forceButton)

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

  it('muvaffaqiyatli qidiruvdan sessiya tanlanganda Majburiy ochishni yashirib oddiy confirm oqimini beradi', async () => {
    renderModal(detectedUnmatchedCandidate)
    await runPlateSearch()

    await waitForText('01B555BB')
    fireEvent.click(page.getByRole('button', { name: /01B555BB/ }))

    expect(queryButtonByText('Majburiy ochish')).toBeNull()
    selectCash()
    clickButton('Tasdiqlash va ochish')
    await waitFor(() =>
      expect(confirmExitCandidateMock).toHaveBeenCalledWith('candidate-1', {
        session_id: 'session-2',
        payment_method: 'cash',
      }),
    )
  })

  it('yangi candidate yuklanganda u uchun bitta yangi avtomatik qidiruv qiladi', async () => {
    const { rerenderCandidate } = renderModal(detectedUnmatchedCandidate)
    await waitFor(() => expect(searchExitCandidateMock).toHaveBeenCalledTimes(1))

    rerenderCandidate({
      ...detectedUnmatchedCandidate,
      candidate_id: 'candidate-2',
      detected_plate: '01D222DD',
    })
    await waitFor(() =>
      expect(
        page.getByPlaceholderText('Chiqayotgan mashina raqamini kiriting'),
      ).toHaveValue('01D222DD'),
    )
    expect(searchExitCandidateMock).toHaveBeenCalledTimes(2)
    expect(searchExitCandidateMock).toHaveBeenLastCalledWith(
      'candidate-2',
      '01D222DD',
    )
  })

  it('sessiyasiz holatda Majburiy ochish qoladi va Tez yordam actioni ko‘rsatilmaydi', async () => {
    renderModal(unmatchedCandidate)

    expect(getButtonByText('Majburiy ochish')).toBeInTheDocument()
    expect(queryButtonByText('Tez yordam')).not.toBeInTheDocument()
  })

  it('Naqd, Online va Majburiy ochish tugmalariga teng balandlik beradi', async () => {
    const { rerenderCandidate } = renderModal()
    const vehicleDetails = page.getByTestId(
      'exit-candidate-vehicle-details',
    )
    const cashButton = scope(vehicleDetails)
      .getByRole('radio', { name: 'Naqd' })
      .closest('label')
    const onlineButton = scope(vehicleDetails)
      .getByRole('radio', { name: 'Online' })
      .closest('label')

    expect(cashButton).toHaveClass('h-8!')
    expect(onlineButton).toHaveClass('h-8!')

    rerenderCandidate(unmatchedCandidate)
    const forceActions = await waitFor(() =>
      page.getByTestId('exit-candidate-force-actions'),
    )
    const forceButton = scope(forceActions).getByRole('button', {
      name: 'Majburiy ochish',
    })

    expect(forceButton).toHaveClass('h-8!', 'flex-1')
  })

  it('Majburiy ochish so‘rovi davomida double-submitni bloklaydi', async () => {
    let resolveRequest!: (value: ExitCandidateBarrierResponse) => void
    forceOpenExitCandidateMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve
      }),
    )
    useEmptySearchResults()
    renderModal(unmatchedCandidate)
    await runPlateSearch('01X999XX')
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
    useEmptySearchResults()
    const { onResolved } = renderModal(unmatchedCandidate)
    await runPlateSearch('01X999XX')

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
    useEmptySearchResults()
    renderModal(unmatchedCandidate)
    await runPlateSearch('01X999XX')
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

  it('exit modalda suggested_plate qidiruv inputini toʻldiradi', () => {
    renderModal({
      ...unmatchedCandidate,
      suggested_plate: '01B555BB',
    })

    expect(
      page.getByPlaceholderText('Chiqayotgan mashina raqamini kiriting'),
    ).toHaveValue('01B555BB')
  })

  it('exit modalda suggested_plate boʻlmasa input boʻsh qoladi (regression)', () => {
    renderModal(unmatchedCandidate)
    clickText('Qidiruv')

    expect(page.getByPlaceholderText('Chiqayotgan mashina raqamini kiriting')).toHaveValue(
      '',
    )
  })
})
