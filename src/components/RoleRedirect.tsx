import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/hooks/redux'
import { homeRouteForRole } from '@/utils/roleRoute'

export default function RoleRedirect() {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const user = useAppSelector((state) => state.auth.user)

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={homeRouteForRole(user.role)} replace />
}
