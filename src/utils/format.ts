import i18n from '@/i18n'

const DATE_LOCALE_MAP: Record<string, string> = {
  'uz-Latn': 'uz-UZ',
  'uz-Cyrl': 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString('uz-UZ')} ${i18n.t('common.currency')}`
}

export function formatDate(
  value: string | number | Date | null | undefined,
): string {
  if (value == null) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const locale = DATE_LOCALE_MAP[i18n.language] ?? 'uz-UZ'
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(
  value: string | number | Date | null | undefined,
): string {
  if (value == null) return '—'
  const targetMs = new Date(value).getTime()
  if (Number.isNaN(targetMs)) return '—'

  const diffMs = Date.now() - targetMs
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return i18n.t('common.justNow')
  if (diffMinutes < 60) {
    return i18n.t('common.minutesAgo', { minutes: diffMinutes })
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return i18n.t('common.hoursAgo', { hours: diffHours })

  const diffDays = Math.floor(diffHours / 24)
  return i18n.t('common.daysAgo', { days: diffDays })
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return i18n.t('sessions.durationHoursMinutes', { hours, minutes: mins })
  }
  return i18n.t('sessions.durationMinutesOnly', { minutes: mins })
}
