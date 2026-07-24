import { describe, expect, it } from 'vitest'
import { getActionLabel, getTargetTypeLabel } from './actionLabels'

const t = (key: string) => key

describe('getActionLabel', () => {
  it('session.force_closed uchun tarjima kaliti qaytaradi (regression)', () => {
    expect(getActionLabel(t, 'session.force_closed')).toBe(
      'activityLog.actionSessionForceClosed',
    )
  })

  it('user.created/updated/blocked/unblocked uchun tarjima kaliti qaytaradi (regression)', () => {
    expect(getActionLabel(t, 'user.created')).toBe('activityLog.actionUserCreated')
    expect(getActionLabel(t, 'user.updated')).toBe('activityLog.actionUserUpdated')
    expect(getActionLabel(t, 'user.blocked')).toBe('activityLog.actionUserBlocked')
    expect(getActionLabel(t, 'user.unblocked')).toBe(
      'activityLog.actionUserUnblocked',
    )
  })

  it("noma'lum action uchun xom qiymatni qaytaradi", () => {
    expect(getActionLabel(t, 'unknown.action')).toBe('unknown.action')
  })
})

describe('getTargetTypeLabel', () => {
  it('malum target turlari uchun tarjima kaliti qaytaradi', () => {
    expect(getTargetTypeLabel(t, 'session')).toBe('activityLog.targetSession')
    expect(getTargetTypeLabel(t, 'user')).toBe('activityLog.targetUser')
    expect(getTargetTypeLabel(t, 'organization')).toBe(
      'activityLog.targetOrganization',
    )
  })

  it("noma'lum target turi uchun xom qiymatni qaytaradi", () => {
    expect(getTargetTypeLabel(t, 'unknown_type')).toBe('unknown_type')
  })
})
