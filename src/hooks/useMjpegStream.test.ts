import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useMjpegStream } from '@/hooks/useMjpegStream'

const BOUNDARY = 'frame'

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function buildMultipartBody(payloads: Uint8Array[]): Uint8Array {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  for (const payload of payloads) {
    parts.push(enc.encode(`--${BOUNDARY}\r\nContent-Type: image/jpeg\r\n\r\n`))
    parts.push(payload)
    parts.push(enc.encode('\r\n'))
  }
  parts.push(enc.encode(`--${BOUNDARY}\r\n`))
  return concat(parts)
}

function mockFetchWithChunk(body: Uint8Array) {
  let served = false
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    headers: {
      get: () => `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
    },
    body: {
      getReader: () => ({
        read: vi.fn().mockImplementation(() => {
          if (!served) {
            served = true
            return Promise.resolve({ done: false, value: body })
          }
          return Promise.resolve({ done: true, value: undefined })
        }),
      }),
    },
  })
}

type Chunk = { done: boolean; value?: Uint8Array }

function createControlledReader() {
  const queue: Chunk[] = []
  const waiters: Array<(chunk: Chunk) => void> = []

  return {
    push(chunk: Chunk) {
      const waiter = waiters.shift()
      if (waiter) {
        waiter(chunk)
      } else {
        queue.push(chunk)
      }
    },
    read: vi.fn(
      () =>
        new Promise<Chunk>((resolve) => {
          const next = queue.shift()
          if (next) resolve(next)
          else waiters.push(resolve)
        }),
    ),
  }
}

function frameChunk(payload: Uint8Array): Uint8Array {
  const enc = new TextEncoder()
  return concat([
    enc.encode(`--${BOUNDARY}\r\nContent-Type: image/jpeg\r\n\r\n`),
    payload,
    enc.encode('\r\n'),
  ])
}

function closingBoundary(): Uint8Array {
  return new TextEncoder().encode(`--${BOUNDARY}\r\n`)
}

describe('useMjpegStream', () => {
  let createObjectUrlMock: ReturnType<typeof vi.fn>
  let revokeObjectUrlMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createObjectUrlMock = vi.fn()
    revokeObjectUrlMock = vi.fn()
    URL.createObjectURL = createObjectUrlMock
    URL.revokeObjectURL = revokeObjectUrlMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("to'g'ri boundary formatidan frame ajratib oladi", async () => {
    createObjectUrlMock.mockReturnValue('blob:mock-url-1')
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const payload = new TextEncoder().encode('jpeg-bytes-1')
    mockFetchWithChunk(buildMultipartBody([payload]))

    const { result, unmount } = renderHook(() => useMjpegStream('/stream'))

    await waitFor(() => expect(result.current.src).toBe('blob:mock-url-1'))
    await waitFor(() => expect(result.current.hasError).toBe(true))

    expect(createObjectUrlMock).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('150ms ichidagi kadrlarni throttling qiladi', async () => {
    let currentTime = 0
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime)
    createObjectUrlMock
      .mockReturnValueOnce('blob:mock-url-1')
      .mockReturnValueOnce('blob:mock-url-2')

    const payload1 = new TextEncoder().encode('jpeg-bytes-1')
    const payload2 = new TextEncoder().encode('jpeg-bytes-2')
    const payload3 = new TextEncoder().encode('jpeg-bytes-3')

    const reader = createControlledReader()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
      },
      body: { getReader: () => reader },
    })

    const { result, unmount } = renderHook(() => useMjpegStream('/stream'))

    await waitFor(() => expect(reader.read).toHaveBeenCalledTimes(1))
    reader.push({ done: false, value: frameChunk(payload1) })
    await waitFor(() => expect(reader.read).toHaveBeenCalledTimes(2))
    expect(result.current.src).toBeNull()

    currentTime = 1000
    reader.push({ done: false, value: frameChunk(payload2) })
    await waitFor(() => expect(reader.read).toHaveBeenCalledTimes(3))
    expect(result.current.src).toBe('blob:mock-url-1')

    currentTime = 1050
    reader.push({ done: false, value: frameChunk(payload3) })
    await waitFor(() => expect(reader.read).toHaveBeenCalledTimes(4))
    expect(result.current.src).toBe('blob:mock-url-1')
    expect(createObjectUrlMock).toHaveBeenCalledTimes(1)

    currentTime = 1200
    reader.push({ done: false, value: closingBoundary() })
    await waitFor(() => expect(reader.read).toHaveBeenCalledTimes(5))
    expect(result.current.src).toBe('blob:mock-url-2')
    expect(createObjectUrlMock).toHaveBeenCalledTimes(2)
    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(1)

    reader.push({ done: true, value: undefined })
    await waitFor(() => expect(result.current.hasError).toBe(true))

    unmount()
    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(2)
  })
})
