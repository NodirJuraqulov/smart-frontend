import { describe, expect, it } from 'vitest'
import { mapAuthPermissions, mapAuthUser } from '@/api/mappers'

describe('mapAuthPermissions', () => {
  it("prefikssiz kalitlarni (dashboard, tariffs, activity_log) can_view_ prefiksli OperatorPermissions formatiga aylantiradi (regression)", () => {
    const result = mapAuthPermissions({
      dashboard: true,
      sessions: true,
      reports: false,
      tariffs: false,
      subscriptions: true,
      settings: false,
      activity_log: true,
    })

    expect(result).toEqual({
      can_view_dashboard: true,
      can_view_sessions: true,
      can_view_reports: false,
      can_view_tariffs: false,
      can_view_subscriptions: true,
      can_view_settings: false,
      can_view_activity_log: true,
    })
  })

  it("permissions UNDEFINED bolganda (owner/super_admin) xatoga uchramasdan barcha maydonlarni TRUE qaytaradi (regression)", () => {
    const result = mapAuthPermissions(undefined)

    expect(result).toEqual({
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

describe('mapAuthUser', () => {
  it("user obyektini mapped permissions bilan birlashtiradi", () => {
    const result = mapAuthUser(
      {
        id: 'u1',
        name: 'Aziz',
        role: 'operator',
        org_name: 'Chorsu',
        pricing_mode: 'hourly',
      },
      {
        dashboard: true,
        sessions: false,
        reports: false,
        tariffs: true,
        subscriptions: false,
        settings: true,
        activity_log: false,
      },
    )

    expect(result).toEqual({
      id: 'u1',
      name: 'Aziz',
      role: 'operator',
      org_name: 'Chorsu',
      pricing_mode: 'hourly',
      permissions: {
        can_view_dashboard: true,
        can_view_sessions: false,
        can_view_reports: false,
        can_view_tariffs: true,
        can_view_subscriptions: false,
        can_view_settings: true,
        can_view_activity_log: false,
      },
    })
  })

  it("permissions UNDEFINED bolganda (owner) xatoga uchramasdan cheklovsiz AuthUser qaytaradi (regression)", () => {
    const result = mapAuthUser(
      {
        id: 'u2',
        name: 'Aziz Egamov',
        role: 'owner',
        org_name: 'Chorsu',
        pricing_mode: 'hourly',
      },
      undefined,
    )

    expect(result).toEqual({
      id: 'u2',
      name: 'Aziz Egamov',
      role: 'owner',
      org_name: 'Chorsu',
      pricing_mode: 'hourly',
      permissions: {
        can_view_dashboard: true,
        can_view_sessions: true,
        can_view_reports: true,
        can_view_tariffs: true,
        can_view_subscriptions: true,
        can_view_settings: true,
        can_view_activity_log: true,
      },
    })
  })
})
