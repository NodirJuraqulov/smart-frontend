import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from '@/utils/clipboard'

function setClipboard(value: { writeText: (text: string) => Promise<void> } | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value,
    configurable: true,
  })
}

function setSecureContext(value: boolean) {
  Object.defineProperty(window, 'isSecureContext', {
    value,
    configurable: true,
  })
}

describe('copyToClipboard', () => {
  afterEach(() => {
    setClipboard(undefined)
    setSecureContext(true)
  })

  it('secure contextda navigator.clipboard.writeText orqali nusxalaydi', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    setSecureContext(true)

    const result = await copyToClipboard('AGENT-KEY-123')

    expect(result).toBe(true)
    expect(writeText).toHaveBeenCalledWith('AGENT-KEY-123')
  })

  it("navigator.clipboard mavjud bo'lmasa (insecure context, HTTP) execCommand fallbackga o'tadi (regression)", async () => {
    setClipboard(undefined)
    setSecureContext(false)
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const result = await copyToClipboard('AGENT-KEY-456')

    expect(result).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it("navigator.clipboard.writeText rad etsa ham fallbackga o'tadi", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    setClipboard({ writeText })
    setSecureContext(true)
    const execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand

    const result = await copyToClipboard('AGENT-KEY-789')

    expect(result).toBe(true)
    expect(execCommand).toHaveBeenCalledWith('copy')
  })

  it("fallback ham muvaffaqiyatsiz bo'lsa false qaytaradi", async () => {
    setClipboard(undefined)
    setSecureContext(false)
    document.execCommand = vi.fn().mockReturnValue(false)

    const result = await copyToClipboard('AGENT-KEY-000')

    expect(result).toBe(false)
  })
})
