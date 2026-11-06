const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const TOKEN_KEY = 'lantern.token'

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* storage unavailable */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* storage unavailable */ }
  },
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra }
  const token = tokenStore.get()
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function errorFrom(res) {
  let message = 'Something went wrong. Please try again.'
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') message = body.detail
  } catch { /* non-JSON error body */ }
  if (res.status === 401 && tokenStore.get()) onUnauthorized()
  return new ApiError(message, res.status)
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  let res
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers: headers(),
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0)
  }
  if (!res.ok) throw await errorFrom(res)
  if (res.status === 204) return null
  return res.json()
}

/**
 * Send a chat message and consume the server-sent event stream.
 * Handlers: onMeta({user_message, risk_level, title}), onToken(text),
 *           onDone(message), onError(detail)
 */
export async function streamMessage(conversationId, content, handlers, signal) {
  let res
  try {
    res = await fetch(`${BASE}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: headers({ Accept: 'text/event-stream' }),
      body: JSON.stringify({ content }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') return
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0)
  }
  if (!res.ok) throw await errorFrom(res)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const dispatch = (block) => {
    let event = 'message'
    let data = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      else if (line.startsWith('data:')) data += line.slice(5).trim()
    }
    if (!data) return
    const payload = JSON.parse(data)
    if (event === 'meta') handlers.onMeta?.(payload)
    else if (event === 'token') handlers.onToken?.(payload.text)
    else if (event === 'done') handlers.onDone?.(payload.message)
    else if (event === 'error') handlers.onError?.(payload.detail)
  }

  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let idx
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        dispatch(buffer.slice(0, idx))
        buffer = buffer.slice(idx + 2)
      }
    }
    if (buffer.trim()) dispatch(buffer)
  } catch (err) {
    if (err.name !== 'AbortError') throw err
  }
}

export const api = {
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  me: () => request('/auth/me'),
  updateMe: (data) => request('/auth/me', { method: 'PATCH', body: data }),
  deleteMe: () => request('/auth/me', { method: 'DELETE' }),

  conversations: () => request('/conversations'),
  conversation: (id) => request(`/conversations/${id}`),
  createConversation: () => request('/conversations', { method: 'POST', body: {} }),
  renameConversation: (id, title) => request(`/conversations/${id}`, { method: 'PATCH', body: { title } }),
  deleteConversation: (id) => request(`/conversations/${id}`, { method: 'DELETE' }),

  moods: (days = 30) => request(`/moods?days=${days}`),
  addMood: (data) => request('/moods', { method: 'POST', body: data }),
  deleteMood: (id) => request(`/moods/${id}`, { method: 'DELETE' }),

  helplines: () => request('/resources/helplines'),
  health: () => request('/health'),
}
