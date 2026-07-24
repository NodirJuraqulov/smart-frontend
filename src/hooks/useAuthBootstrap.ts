import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '@/api/auth'
import { logout, setUser } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from './redux'

export function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const user = useAppSelector((state) => state.auth.user)

  const { data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    enabled: !!accessToken && !user,
    retry: false,
  })

  useEffect(() => {
    if (data) {
      dispatch(setUser(data))
    }
  }, [data, dispatch])

  useEffect(() => {
    if (isError) {
      dispatch(logout())
    }
  }, [isError, dispatch])

  return { isBootstrapping: !!accessToken && !user }
}
