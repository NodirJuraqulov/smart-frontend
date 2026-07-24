import { describe, expect, it, vi } from 'vitest'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('./axiosInstance', () => ({
  axiosInstance: {
    get: getMock,
    post: postMock,
  },
}))

import { fetchCurrentUser, login } from '@/api/auth'

const authPermissionsDto = {
  dashboard: true,
  sessions: true,
  reports: true,
  tariffs: false,
  subscriptions: false,
  settings: false,
  activity_log: false,
}

const authUserDto = {
  id: 'u1',
  name: 'Bekzod',
  role: 'operator' as const,
  org_name: 'Chorsu',
  pricing_mode: null,
}

describe('fetchCurrentUser', () => {
  it("'permissions' user obyekti ICHIDA EMAS, JAVOBNING TEPASIDA (sibling) kelganda ham togri oqiydi (regression)", async () => {
    getMock.mockResolvedValue({
      data: { user: authUserDto, permissions: authPermissionsDto },
    })

    const user = await fetchCurrentUser()

    expect(user.permissions).toEqual({
      can_view_dashboard: true,
      can_view_sessions: true,
      can_view_reports: true,
      can_view_tariffs: false,
      can_view_subscriptions: false,
      can_view_settings: false,
      can_view_activity_log: false,
    })
  })
})

describe('login', () => {
  it("javobdagi prefikssiz permissions'ni OperatorPermissions formatiga aylantiradi (regression)", async () => {
    postMock.mockResolvedValue({
      data: {
        token: 'access-token',
        refreshToken: 'refresh-token',
        user: authUserDto,
        permissions: authPermissionsDto,
      },
    })

    const result = await login({ login: 'bekzod1', password: 'secret1' })

    expect(result.token).toBe('access-token')
    expect(result.user.permissions.can_view_dashboard).toBe(true)
    expect(result.user.permissions.can_view_tariffs).toBe(false)
  })

  it("owner uchun javobda 'permissions' UMUMAN BOLMASA HAM xatoga uchramasdan cheklovsiz AuthUser qaytaradi (regression)", async () => {
    postMock.mockResolvedValue({
      data: {
        token: 'owner-access-token',
        refreshToken: 'owner-refresh-token',
        user: {
          id: 'u2',
          name: 'Aziz Egamov',
          role: 'owner',
          org_name: 'Chorsu',
          pricing_mode: 'hourly',
        },
      },
    })

    const result = await login({ login: 'aziz1', password: 'secret1' })

    expect(result.token).toBe('owner-access-token')
    expect(result.user.role).toBe('owner')
    expect(result.user.permissions).toEqual({
      can_view_dashboard: true,
      can_view_sessions: true,
      can_view_reports: true,
      can_view_tariffs: true,
      can_view_subscriptions: true,
      can_view_settings: true,
      can_view_activity_log: true,
    })
  })
})
