import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'guest')

  const logout = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('guest')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!tokenStore.get()) return
    api
      .me()
      .then((u) => {
        setUser(u)
        setStatus('authed')
      })
      .catch((err) => {
        // Keep the token if the server is just unreachable; drop it if rejected.
        if (err.status === 401) logout()
        else setStatus('offline')
      })
  }, [logout])

  const finishAuth = useCallback(({ access_token, user: u }) => {
    tokenStore.set(access_token)
    setUser(u)
    setStatus('authed')
    return u
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      setUser,
      login: async (email, password) => finishAuth(await api.login({ email, password })),
      register: async (data) => finishAuth(await api.register(data)),
      logout,
    }),
    [user, status, finishAuth, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
