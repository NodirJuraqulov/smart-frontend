import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AuthenticatedImage from './AuthenticatedImage'

const { axiosGetMock } = vi.hoisted(() => ({
  axiosGetMock: vi.fn(),
}))

vi.mock('@/api/axiosInstance', () => ({
  axiosInstance: {
    get: axiosGetMock,
  },
}))

describe('AuthenticatedImage', () => {
  const createObjectURLMock = vi.fn(() => 'blob:protected-image')
  const revokeObjectURLMock = vi.fn()

  beforeEach(() => {
    axiosGetMock.mockReset()
    createObjectURLMock.mockClear()
    revokeObjectURLMock.mockClear()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    })
  })

  it('null URL uchun HTTP so‘rov yubormaydi', () => {
    render(<AuthenticatedImage url={null} alt="Kirish — avtomobil" />)

    expect(axiosGetMock).not.toHaveBeenCalled()
  })

  it('rasmni mavjud authenticated API client orqali Blob sifatida yuklaydi', async () => {
    const blob = new Blob(['image'], { type: 'image/jpeg' })
    axiosGetMock.mockResolvedValue({ data: blob })

    render(
      <AuthenticatedImage
        url="/api/parking/sessions/90/images/exit-vehicle"
        alt="Chiqish — avtomobil"
      />,
    )

    await screen.findByRole('img', { name: 'Chiqish — avtomobil' })
    expect(axiosGetMock).toHaveBeenCalledWith(
      '/api/parking/sessions/90/images/exit-vehicle',
      expect.objectContaining({
        responseType: 'blob',
        signal: expect.any(AbortSignal),
      }),
    )
    expect(createObjectURLMock).toHaveBeenCalledWith(blob)
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'blob:protected-image',
    )
  })

  it('xato so‘rovda error placeholder ko‘rsatadi', async () => {
    axiosGetMock.mockRejectedValue(new Error('Forbidden'))

    render(
      <AuthenticatedImage
        url="/api/protected/missing.jpg"
        alt="Chiqish — avtomobil"
      />,
    )

    expect(
      await screen.findByText(
        "Chiqish — avtomobil rasmini yuklab bo'lmadi",
      ),
    ).toBeInTheDocument()
  })

  it('cleanup vaqtida so‘rovni bekor qiladi va object URLni revoke qiladi', async () => {
    axiosGetMock.mockResolvedValue({
      data: new Blob(['image'], { type: 'image/jpeg' }),
    })
    const { unmount } = render(
      <AuthenticatedImage url="/api/protected/image.jpg" alt="ANPR" />,
    )

    await waitFor(() => expect(createObjectURLMock).toHaveBeenCalled())
    const signal = axiosGetMock.mock.calls[0][1].signal as AbortSignal

    unmount()

    expect(signal.aborted).toBe(true)
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:protected-image')
  })

  it('bir xil URL bilan rerender qilinganda rasmni qayta yuklamaydi', async () => {
    axiosGetMock.mockResolvedValue({
      data: new Blob(['image'], { type: 'image/jpeg' }),
    })
    const { rerender } = render(
      <AuthenticatedImage url="/api/protected/image.jpg" alt="ANPR" />,
    )

    await screen.findByRole('img', { name: 'ANPR' })
    rerender(<AuthenticatedImage url="/api/protected/image.jpg" alt="ANPR" />)

    expect(axiosGetMock).toHaveBeenCalledTimes(1)
  })
})
