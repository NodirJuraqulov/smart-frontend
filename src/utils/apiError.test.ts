import { describe, expect, it } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { getErrorMessage } from '@/utils/apiError'

function makeAxiosError(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: {} as never,
  } as AxiosResponse
  return error
}

describe('getErrorMessage', () => {
  it('400 xatosida serverning message xabarini qaytaradi', () => {
    const error = makeAxiosError(400, { message: "Noto'g'ri ma'lumot" })
    expect(getErrorMessage(error, 'fallback')).toBe("Noto'g'ri ma'lumot")
  })

  it('401 xatosida serverning message xabarini qaytaradi', () => {
    const error = makeAxiosError(401, { message: 'Ruxsat etilmagan' })
    expect(getErrorMessage(error, 'fallback')).toBe('Ruxsat etilmagan')
  })

  it('409 xatosida server message bolmasa conflictFallback qaytaradi', () => {
    const error = makeAxiosError(409, {})
    expect(getErrorMessage(error, 'fallback', 'conflict fallback')).toBe(
      'conflict fallback',
    )
  })

  it('409 xatosida server message mavjud bolsa unga ustunlik beradi', () => {
    const error = makeAxiosError(409, { message: 'Sessiya band' })
    expect(getErrorMessage(error, 'fallback', 'conflict fallback')).toBe(
      'Sessiya band',
    )
  })

  it('server message bolmagan boshqa xatolarda fallback qaytaradi', () => {
    const error = makeAxiosError(500, {})
    expect(getErrorMessage(error, 'fallback')).toBe('fallback')
  })

  it('tarmoq xatosida (response yoq) fallback qaytaradi', () => {
    const error = new AxiosError('Network Error')
    expect(getErrorMessage(error, 'fallback')).toBe('fallback')
  })

  it('axios xatosi bolmagan holatda ham fallback qaytaradi', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('fallback')
  })
})
