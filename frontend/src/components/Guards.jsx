import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function Splash({ message = 'Lighting the lantern…' }) {
  return (
    <div className="center-screen" role="status">
      <div>
        <div className="glow" />
        <p style={{ marginTop: '1rem', color: 'var(--ink-soft)' }}>{message}</p>
      </div>
    </div>
  )
}

function Offline() {
  return (
    <div className="center-screen">
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 'var(--step-3)' }}>Can't reach Lantern right now</h1>
        <p style={{ color: 'var(--ink-soft)', margin: '0.75rem 0 1.5rem' }}>
          The server isn't responding. Check your connection, then try again. If you need to talk
          to someone urgently, call Tele-MANAS on 14416 or emergency services on 112.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Try again</button>
      </div>
    </div>
  )
}

export function RequireAuth({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status === 'offline') return <Offline />
  if (status !== 'authed') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function GuestOnly({ children }) {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'authed') return <Navigate to="/chat" replace />
  return children
}
