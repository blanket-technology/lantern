import { Link, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import Brand from './components/Brand.jsx'
import { GuestOnly, RequireAuth, Splash } from './components/Guards.jsx'
import { useAuth } from './context/AuthContext.jsx'
import AccountPage from './pages/AccountPage.jsx'
import { LoginPage, RegisterPage } from './pages/AuthPages.jsx'
import BreathePage from './pages/BreathePage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import MoodPage from './pages/MoodPage.jsx'
import SupportPage from './pages/SupportPage.jsx'

function NotFound() {
  return (
    <div className="center-screen not-found">
      <div>
        <h1>This page doesn't exist</h1>
        <p>The link may be old, or the address has a typo.</p>
        <Link className="btn btn-primary" to="/">Go to Lantern</Link>
      </div>
    </div>
  )
}

// Help must always be reachable, signed in or not.
function SupportRoute() {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'authed') return <AppShell><SupportPage /></AppShell>
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header className="landing-nav"><Brand /><Link className="btn btn-quiet" to="/login">Sign in</Link></header>
      <SupportPage />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route path="/support" element={<SupportRoute />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        {/* One optional-param route so the page stays mounted while a new chat gets its id */}
        <Route path="/chat/:id?" element={<ChatPage />} />
        <Route path="/mood" element={<MoodPage />} />
        <Route path="/breathe" element={<BreathePage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
