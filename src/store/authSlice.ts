import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/types/auth'

const REGISTRATOR_USER_KEY = 'registratorUser'

function getStoredRegistratorUser(): AuthUser | null {
  const value = localStorage.getItem(REGISTRATOR_USER_KEY)
  if (!value) return null

  try {
    const user = JSON.parse(value) as AuthUser
    return user.role === 'registrator' ? user : null
  } catch {
    localStorage.removeItem(REGISTRATOR_USER_KEY)
    return null
  }
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
}

const storedAccessToken = localStorage.getItem('accessToken')

const initialState: AuthState = {
  user: storedAccessToken ? getStoredRegistratorUser() : null,
  accessToken: storedAccessToken,
  refreshToken: localStorage.getItem('refreshToken'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: AuthUser
        token: string
        refreshToken: string
      }>,
    ) => {
      state.user = action.payload.user
      state.accessToken = action.payload.token
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem('accessToken', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
      if (action.payload.user.role === 'registrator') {
        localStorage.setItem(
          REGISTRATOR_USER_KEY,
          JSON.stringify(action.payload.user),
        )
      } else {
        localStorage.removeItem(REGISTRATOR_USER_KEY)
      }
    },
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload
      if (action.payload.role === 'registrator') {
        localStorage.setItem(REGISTRATOR_USER_KEY, JSON.stringify(action.payload))
      } else {
        localStorage.removeItem(REGISTRATOR_USER_KEY)
      }
    },
    tokensRefreshed: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string }>,
    ) => {
      state.accessToken = action.payload.accessToken
      localStorage.setItem('accessToken', action.payload.accessToken)
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken
        localStorage.setItem('refreshToken', action.payload.refreshToken)
      }
    },
    logout: (state) => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem(REGISTRATOR_USER_KEY)
    },
  },
})

export const { setCredentials, setUser, tokensRefreshed, logout } =
  authSlice.actions
export default authSlice.reducer
