import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function AuthFrame({ title, sub, children, footer }) {
  return (
    <div className="auth-page">
      <div className="glow" aria-hidden="true" />
      <div className="auth-card">
        <Brand />
        <div>
          <h1>{title}</h1>
          <p className="sub">{sub}</p>
        </div>
        {children}
        <p className="auth-switch">{footer}</p>
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate(location.state?.from || '/chat', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      title="Welcome back"
      sub="Pick up where you left off."
      footer={<>New here? <Link to="/register">Create an account</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy || !email || !password}>
          {busy ? <span className="spinner" /> : null} Sign in
        </button>
      </form>
    </AuthFrame>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ display_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setBusy(true)
    try {
      await register({ ...form, display_name: form.display_name.trim() })
      navigate('/chat', { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AuthFrame
      title="Create your account"
      sub="So your conversations and check-ins are kept for you, and only you."
      footer={<>Already have an account? <Link to="/login">Sign in</Link></>}
    >
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="name">What should Lantern call you?</label>
          <input id="name" className="input" autoComplete="given-name" required maxLength={80} value={form.display_name} onChange={set('display_name')} />
          <span className="hint">A first name or nickname is fine.</span>
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
          <span className="hint">At least 8 characters.</span>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy || !form.display_name.trim() || !form.email || !form.password}>
          {busy ? <span className="spinner" /> : null} Create account
        </button>
      </form>
    </AuthFrame>
  )
}
