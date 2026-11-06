import { useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { applyTheme, getTheme } from '../lib/theme.js'

const THEMES = [
  ['system', 'Match my device'],
  ['light', 'Light'],
  ['dark', 'Dark'],
]

export default function AccountPage() {
  const { user, setUser, logout } = useAuth()
  const [name, setName] = useState(user.display_name)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(getTheme())
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const saveName = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      setUser(await api.updateMe({ display_name: name.trim() }))
      setMessage('Name saved')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async (e) => {
    e.preventDefault()
    setDeleting(true)
    try {
      await api.deleteMe()
      logout()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-head">
          <h1>Account</h1>
          <p>Signed in as {user.email}.</p>
        </header>

        <div className="stack">
          <section className="panel" aria-labelledby="profile-title">
            <h2 id="profile-title">What Lantern calls you</h2>
            <form className="account-form" onSubmit={saveName}>
              <div className="field">
                <label htmlFor="display-name">Name</label>
                <input id="display-name" className="input" value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} />
              </div>
              {error && <div className="form-error" role="alert">{error}</div>}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button className="btn btn-primary" disabled={saving || !name.trim() || name.trim() === user.display_name}>
                  Save name
                </button>
                {message && <span className="saved-note" role="status">{message}</span>}
              </div>
            </form>
          </section>

          <section className="panel" aria-labelledby="theme-title">
            <h2 id="theme-title">Appearance</h2>
            <div className="theme-switch" role="group" aria-labelledby="theme-title">
              {THEMES.map(([value, label]) => (
                <button
                  key={value}
                  className="chip"
                  aria-pressed={theme === value}
                  onClick={() => {
                    setTheme(value)
                    applyTheme(value)
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="session-title">
            <h2 id="session-title">Sign out</h2>
            <p className="panel-sub">Signing out on a shared device keeps your conversations private.</p>
            <button className="btn btn-quiet" style={{ marginTop: '1rem' }} onClick={logout}>Sign out</button>
          </section>

          <section className="panel danger-zone" aria-labelledby="delete-title">
            <h2 id="delete-title">Delete your account</h2>
            <p className="panel-sub">
              This permanently deletes your account, every conversation and every check-in. It can't be undone.
            </p>
            <form className="account-form" onSubmit={deleteAccount}>
              <div className="field">
                <label htmlFor="confirm-delete">Type DELETE to confirm</label>
                <input id="confirm-delete" className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
              </div>
              <div>
                <button className="btn btn-danger" disabled={confirm !== 'DELETE' || deleting}>
                  {deleting ? 'Deleting…' : 'Delete everything'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
