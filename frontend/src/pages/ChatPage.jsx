import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, streamMessage } from '../api/client.js'
import Composer from '../components/Composer.jsx'
import CrisisBanner from '../components/CrisisBanner.jsx'
import { ArrowIcon } from '../components/Icons.jsx'
import Message from '../components/Message.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useConversations } from '../context/ConversationsContext.jsx'

const STARTERS = [
  "I can't switch my brain off at night",
  'Work has been too much lately',
  "I feel low and I don't know why",
  'I just want to vent for a bit',
]

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return "It's late"
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function useAiMode() {
  const [mode, setMode] = useState(null)
  useEffect(() => {
    api.health().then((h) => setMode(h.ai_mode)).catch(() => {})
  }, [])
  return mode
}

export default function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { upsert } = useConversations()
  const aiMode = useAiMode()

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(Boolean(id))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [showCrisis, setShowCrisis] = useState(false)

  const scroller = useRef(null)
  const composer = useRef(null)
  const stickToBottom = useRef(true)
  const skipLoadFor = useRef(null)
  const abort = useRef(null)

  // Load the conversation when the URL changes (but not right after we created it).
  useEffect(() => {
    setError('')
    if (!id) {
      setMessages([])
      setShowCrisis(false)
      setLoading(false)
      return
    }
    if (skipLoadFor.current === id) {
      skipLoadFor.current = null
      return
    }
    abort.current?.abort()
    let cancelled = false
    setLoading(true)
    api
      .conversation(id)
      .then((c) => {
        if (cancelled) return
        setMessages(c.messages)
        const lastUser = [...c.messages].reverse().find((m) => m.role === 'user')
        setShowCrisis(lastUser?.risk_level === 'crisis')
        stickToBottom.current = true
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 404) navigate('/chat', { replace: true })
        else setError(err.message)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, navigate])

  useEffect(() => () => abort.current?.abort(), [])

  useEffect(() => {
    if (!loading) composer.current?.focus()
  }, [loading, id])

  useLayoutEffect(() => {
    const el = scroller.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const onScroll = () => {
    const el = scroller.current
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  const send = useCallback(
    async (text) => {
      setError('')
      setSending(true)
      stickToBottom.current = true

      let convoId = id
      try {
        if (!convoId) {
          const convo = await api.createConversation()
          upsert(convo)
          convoId = convo.id
          skipLoadFor.current = convo.id
          navigate(`/chat/${convo.id}`, { replace: true })
        }
      } catch (err) {
        setError(err.message)
        setSending(false)
        composer.current?.setValue(text)
        return
      }

      const tempUser = { id: 'pending-user', role: 'user', content: text, risk_level: 'none' }
      const placeholder = { id: 'pending-reply', role: 'assistant', content: '', streaming: true }
      setMessages((prev) => [...prev, tempUser, placeholder])

      const controller = new AbortController()
      abort.current = controller

      try {
        await streamMessage(
          convoId,
          text,
          {
            onMeta: ({ user_message, risk_level, title }) => {
              setMessages((prev) => prev.map((m) => (m.id === 'pending-user' ? user_message : m)))
              if (risk_level === 'crisis') setShowCrisis(true)
              upsert({ id: convoId, title, updated_at: new Date().toISOString() })
            },
            onToken: (chunk) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === 'pending-reply' ? { ...m, content: m.content + chunk } : m)),
              )
            },
            onDone: (saved) => {
              setMessages((prev) => prev.map((m) => (m.id === 'pending-reply' ? saved : m)))
              upsert({ id: convoId, updated_at: saved.created_at })
            },
            onError: (detail) => setError(detail),
          },
          controller.signal,
        )
      } catch (err) {
        setError(err.message)
        setMessages((prev) => prev.filter((m) => m.id !== 'pending-reply' && m.id !== 'pending-user'))
        composer.current?.setValue(text)
      } finally {
        // If the stream ended without a "done" event, keep whatever text arrived.
        setMessages((prev) =>
          prev
            .filter((m) => !(m.id === 'pending-reply' && !m.content))
            .map((m) => (m.streaming ? { ...m, streaming: false } : m)),
        )
        setSending(false)
        composer.current?.focus()
      }
    },
    [id, navigate, upsert],
  )

  const firstName = user?.display_name?.split(' ')[0]
  const empty = !loading && messages.length === 0
  const replying = messages.some((m) => m.streaming)

  return (
    <div className="chat">
      <div className="chat-scroll" ref={scroller} onScroll={onScroll}>
        <div className="chat-halo" aria-hidden="true">
          <div className={`glow${replying ? ' is-bright' : ''}`} />
        </div>
        <div className="chat-column">
          {loading && (
            <p role="status" style={{ color: 'var(--ink-faint)' }}>Opening conversation…</p>
          )}

          {empty && (
            <div className="chat-empty">
              <h1>
                {greeting()}
                {firstName ? `, ${firstName}` : ''}. What's on your mind?
              </h1>
              <p>
                Say as much or as little as you like. There's no right way to start, and nothing
                you say here is too small.
              </p>
              <div className="starters" role="list">
                {STARTERS.map((s) => (
                  <button key={s} role="listitem" onClick={() => send(s)} disabled={sending}>
                    <span>{s}</span>
                    <ArrowIcon size={18} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && messages.length > 0 && (
            <div className="messages" role="log" aria-label="Conversation">
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="composer-wrap">
        {showCrisis && <CrisisBanner onDismiss={() => setShowCrisis(false)} />}
        {error && (
          <div className="banner error" role="alert">
            <span>{error}</span>
            <button className="btn-text" onClick={() => setError('')}>Dismiss</button>
          </div>
        )}
        <div className="composer-inner">
          <Composer
            ref={composer}
            onSend={send}
            disabled={sending || loading}
            placeholder={empty ? 'Start typing, whenever you are ready' : 'Write a reply'}
          />
          <p className="composer-note">
            {aiMode && (
              <span className={`mode-pill${aiMode === 'offline' ? ' offline' : ''}`} title={aiMode === 'offline' ? 'No AI model is configured; using the built-in companion' : 'Connected to the AI model'}>
                <i /> {aiMode === 'offline' ? 'Offline companion' : 'AI model connected'}
              </span>
            )}
            Lantern is an AI and can get things wrong. In an emergency, <Link to="/support">get help now</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
