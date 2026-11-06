import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ConversationsProvider, useConversations } from '../context/ConversationsContext.jsx'
import { MenuIcon } from './Icons.jsx'
import Sidebar from './Sidebar.jsx'

const TITLES = {
  '/chat': 'New conversation',
  '/mood': 'Check in',
  '/breathe': 'Breathe',
  '/support': 'Get help now',
  '/account': 'Account',
}

function TopBar({ onMenu }) {
  const { pathname } = useLocation()
  const { items } = useConversations()
  const chatId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null
  const title = chatId ? items.find((c) => c.id === chatId)?.title || 'Conversation' : TITLES[pathname] || 'Lantern'
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onMenu} aria-label="Open menu">
        <MenuIcon />
      </button>
      <span className="title">{title}</span>
    </header>
  )
}

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <ConversationsProvider>
      <div className={`shell${open ? ' drawer-open' : ''}`}>
        <Sidebar onClose={() => setOpen(false)} />
        <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />
        <main className="main" id="main">
          <TopBar onMenu={() => setOpen(true)} />
          {children ?? <Outlet />}
        </main>
      </div>
    </ConversationsProvider>
  )
}
