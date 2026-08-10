import type { UserRole } from '@/types/auth'
import type { CashCollection } from '@/types/cashCollection'

const CASH_COLLECTION_ROLES: UserRole[] = ['owner', 'kassir', 'super_admin']

export function canManageCashCollections(
  role: UserRole | undefined,
  orgId: number | null | undefined,
): boolean {
  return Boolean(role && CASH_COLLECTION_ROLES.includes(role) && orgId != null)
}

export const CASH_COLLECTIONS_QUERY_KEY = ['cash-collections'] as const

export function collectionDifference(collection: CashCollection): number {
  return collection.expected_amount - collection.collected_amount
}
