import type { UserRole } from '@/types/auth'

export function homeRouteForRole(role: UserRole): string {
  return role === 'super_admin' ? '/admin' : '/operator'
}
