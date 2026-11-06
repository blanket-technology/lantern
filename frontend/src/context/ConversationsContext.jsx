import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const ConversationsContext = createContext(null)

const byRecent = (a, b) => new Date(b.updated_at) - new Date(a.updated_at)

export function ConversationsProvider({ children }) {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    try {
      setItems(await api.conversations())
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    refresh().catch(() => {})
  }, [refresh])

  const upsert = useCallback((convo) => {
    setItems((prev) => {
      const rest = prev.filter((c) => c.id !== convo.id)
      const existing = prev.find((c) => c.id === convo.id)
      return [{ ...existing, ...convo }, ...rest].sort(byRecent)
    })
  }, [])

  const remove = useCallback((id) => setItems((prev) => prev.filter((c) => c.id !== id)), [])

  const value = useMemo(() => ({ items, loaded, refresh, upsert, remove }), [items, loaded, refresh, upsert, remove])
  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>
}

export function useConversations() {
  const ctx = useContext(ConversationsContext)
  if (!ctx) throw new Error('useConversations must be used inside ConversationsProvider')
  return ctx
}
