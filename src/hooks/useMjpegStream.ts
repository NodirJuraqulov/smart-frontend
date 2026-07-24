import { useEffect, useRef, useState } from 'react'

interface UseMjpegStreamResult {
  src: string | null
  hasError: boolean
}

function concatBytes(
  a: Uint8Array<ArrayBuffer>,
  b: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}

function indexOfBytes(
  haystack: Uint8Array<ArrayBuffer>,
  needle: Uint8Array<ArrayBuffer>,
  fromIndex = 0,
): number {
  outer: for (let i = fromIndex; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

const CRLFCRLF = new TextEncoder().encode('\r\n\r\n')

interface ExtractedFrame {
  jpegBytes: Uint8Array<ArrayBuffer>
  rest: Uint8Array<ArrayBuffer>
}

function extractFrame(
  buffer: Uint8Array<ArrayBuffer>,
  boundaryBytes: Uint8Array<ArrayBuffer>,
): ExtractedFrame | null {
  const firstBoundary = indexOfBytes(buffer, boundaryBytes)
  if (firstBoundary === -1) return null

  const headerStart = firstBoundary + boundaryBytes.length
  const headerEnd = indexOfBytes(buffer, CRLFCRLF, headerStart)
  if (headerEnd === -1) return null

  const payloadStart = headerEnd + CRLFCRLF.length
  const nextBoundary = indexOfBytes(buffer, boundaryBytes, payloadStart)
  if (nextBoundary === -1) return null // next part hasn't arrived yet

  let payloadEnd = nextBoundary
  if (
    payloadEnd >= 2 &&
    buffer[payloadEnd - 1] === 0x0a &&
    buffer[payloadEnd - 2] === 0x0d
  ) {
    payloadEnd -= 2
  }

  return {
    jpegBytes: buffer.slice(payloadStart, payloadEnd),
    rest: buffer.slice(nextBoundary),
  }
}

function parseBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  if (!match) return null
  const raw = (match[1] ?? match[2]).trim()
  return raw.replace(/^-+/, '')
}

export function useMjpegStream(url: string | null): UseMjpegStreamResult {
  const [src, setSrc] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const currentObjectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    setSrc(null)
    setHasError(false)

    if (!url) return

    const controller = new AbortController()
    let cancelled = false

    const revokeCurrent = () => {
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current)
        currentObjectUrlRef.current = null
      }
    }

    async function run() {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(url as string, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          signal: controller.signal,
        })

        if (!response.ok || !response.body) {
          if (!cancelled) setHasError(true)
          return
        }

        const boundary = parseBoundary(response.headers.get('Content-Type') ?? '')
        if (!boundary) {
          if (!cancelled) setHasError(true)
          return
        }
        const boundaryBytes = new TextEncoder().encode(`--${boundary}`)

        const reader = response.body.getReader()
        let buffer = new Uint8Array(0)
        const MIN_FRAME_INTERVAL_MS = 150
        let lastFrameAt = 0

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break
          if (!value) continue

          buffer = concatBytes(buffer, new Uint8Array(value))

          let frame = extractFrame(buffer, boundaryBytes)
          while (frame) {
            buffer = frame.rest
            const now = performance.now()
            if (
              frame.jpegBytes.length > 0 &&
              now - lastFrameAt >= MIN_FRAME_INTERVAL_MS
            ) {
              lastFrameAt = now
              const objectUrl = URL.createObjectURL(
                new Blob([frame.jpegBytes], { type: 'image/jpeg' }),
              )
              revokeCurrent()
              currentObjectUrlRef.current = objectUrl
              if (!cancelled) setSrc(objectUrl)
            }
            frame = extractFrame(buffer, boundaryBytes)
          }
        }

        if (!cancelled) setHasError(true) // stream ended
      } catch {
        if (!cancelled) setHasError(true)
      }
    }

    run()

    return () => {
      cancelled = true
      controller.abort()
      revokeCurrent()
    }
  }, [url])

  return { src, hasError }
}
