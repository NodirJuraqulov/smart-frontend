import type { UserRole } from '@/types/auth'

export function homeRouteForRole(role: UserRole): string {
  if (role === 'super_admin') return '/admin'
  if (role === 'kassir') return '/operator/reports'
  return '/operator'
}
