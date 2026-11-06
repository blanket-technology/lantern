import { useState } from 'react'
import { NavLink, useMatch, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useConversations } from '../context/ConversationsContext.jsx'
import Brand from './Brand.jsx'
import {
  BreatheIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  LogoutIcon,
  MoodIcon,
  PlusIcon,
  SupportIcon,
  TalkIcon,
  TrashIcon,
  UserIcon,
} from './Icons.jsx'

function ConversationItem({ convo, active, onNavigate }) {
  const { upsert, remove } = useConversations()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(convo.title)

  const save = async (e) => {
    e?.preventDefault()
    const next = title.trim()
    setEditing(false)
    if (!next || next === convo.title) return setTitle(convo.title)
    try {
      upsert(await api.renameConversation(convo.id, next))
    } catch {
      setTitle(convo.title)
    }
  }

  const destroy = async () => {
    if (!window.confirm(`Delete "${convo.title}"? This can't be undone.`)) return
    try {
      await api.deleteConversation(convo.id)
      remove(convo.id)
      if (active) navigate('/chat')
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (editing) {
    return (
      <li className="convo-item active">
        <form onSubmit={save} style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
          <label className="visually-hidden" htmlFor={`rename-${convo.id}`}>Conversation name</label>
          <input
            id={`rename-${convo.id}`}
            className="input convo-rename"
            value={title}
            autoFocus
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => e.key === 'Escape' && (setTitle(convo.title), setEditing(false))}
          />
          <button type="submit" className="icon-btn" aria-label="Save name"><CheckIcon size={16} /></button>
        </form>
      </li>
    )
  }

  return (
    <li className={`convo-item${active ? ' active' : ''}`}>
      <NavLink to={`/chat/${convo.id}`} onClick={onNavigate} title={convo.title}>
        {convo.title}
      </NavLink>
      <div className="item-actions">
        <button className="icon-btn" aria-label={`Rename ${convo.title}`} onClick={() => setEditing(true)}>
          <EditIcon size={16} />
        </button>
        <button className="icon-btn" aria-label={`Delete ${convo.title}`} onClick={destroy}>
          <TrashIcon size={16} />
        </button>
      </div>
    </li>
  )
}

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth()
  const { items, loaded } = useConversations()
  const navigate = useNavigate()
  const match = useMatch('/chat/:id')
  const activeId = match?.params.id

  const initials = (user?.display_name || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-head">
        <Brand to="/chat" />
        <button className="icon-btn mobile-only" onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </button>
      </div>

      <button
        className="btn btn-primary new-chat"
        onClick={() => {
          navigate('/chat')
          onClose()
        }}
      >
        <PlusIcon size={18} /> New conversation
      </button>

      <nav className="nav">
        <NavLink to="/chat" end onClick={onClose} className={({ isActive }) => (isActive || activeId ? 'active' : '')}>
          <TalkIcon /> Talk
        </NavLink>
        <NavLink to="/mood" onClick={onClose}><MoodIcon /> Check in</NavLink>
        <NavLink to="/breathe" onClick={onClose}><BreatheIcon /> Breathe</NavLink>
        <NavLink to="/support" onClick={onClose}><SupportIcon /> Get help now</NavLink>
      </nav>

      <section className="convo-section" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Recent conversations</h2>
        {loaded && items.length === 0 ? (
          <p className="convo-empty">Your conversations will appear here.</p>
        ) : (
          <ul className="convo-list">
            {items.map((c) => (
              <ConversationItem key={c.id} convo={c} active={c.id === activeId} onNavigate={onClose} />
            ))}
          </ul>
        )}
      </section>

      <div className="sidebar-foot">
        <div className="avatar" aria-hidden="true">{initials}</div>
        <div className="who">
          <strong>{user?.display_name}</strong>
          <span>{user?.email}</span>
        </div>
        <NavLink to="/account" className="icon-btn" aria-label="Account settings" onClick={onClose}>
          <UserIcon />
        </NavLink>
        <button className="icon-btn" aria-label="Sign out" onClick={logout}>
          <LogoutIcon />
        </button>
      </div>
    </aside>
  )
}
