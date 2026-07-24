import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import type { OperatorPermissions } from '@/types/permissions'

interface PermissionRouteProps {
  permission: keyof OperatorPermissions
}

export default function PermissionRoute({ permission }: PermissionRouteProps) {
  const role = useAppSelector((state) => state.auth.user?.role)
  const permissions = useAppSelector((state) => state.auth.user?.permissions)

  if (role !== 'owner' && permissions && !permissions[permission]) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
