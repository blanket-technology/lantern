import { Link } from 'react-router-dom'
import Brand from '../components/Brand.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const DEMO = [
  { role: 'user', text: "Couldn't sleep again. My brain keeps replaying the presentation I messed up." },
  {
    role: 'assistant',
    text: "That replay loop is exhausting, especially at night when there's nothing to interrupt it. What part keeps coming back the most?",
  },
  { role: 'user', text: 'The moment I blanked on the numbers. Everyone just stared.' },
  {
    role: 'assistant',
    text: 'That would sting. It sounds like that one moment is standing in for the whole thing. Did anything about the rest of it go okay?',
  },
]

const USES = [
  ['When your mind is racing', 'Write it out and get help sorting what is a real problem from what is 2 am worry.'],
  ['When you need to vent', "Say the thing you can't say to anyone else, without being judged or rushed."],
  ['When you want to notice patterns', 'Quick daily check-ins show how sleep, work and people shape your weeks.'],
  ['When your body is wound up', 'A guided breathing exercise that follows a slow, steady light.'],
]

export default function LandingPage() {
  const { status } = useAuth()
  const authed = status === 'authed'

  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav className="actions" aria-label="Account">
          {authed ? (
            <Link className="btn btn-primary" to="/chat">Open Lantern</Link>
          ) : (
            <>
              <Link className="btn btn-quiet" to="/login">Sign in</Link>
              <Link className="btn btn-primary" to="/register">Create account</Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div>
            <h1>A quiet place to talk things through, at any hour.</h1>
            <p className="lede">
              Lantern is an AI companion that listens without judging, helps you make sense of what
              you're feeling, and points you to real people when you need more than a chat.
            </p>
            <div className="cta">
              <Link className="btn btn-primary" to={authed ? '/chat' : '/register'}>Start talking</Link>
              {!authed && <Link className="btn-text" to="/login">I already have an account</Link>}
            </div>
            <p className="reassure">
              Free to use. Your conversations are private to your account, and you can delete
              everything whenever you want.
            </p>
          </div>

          <div className="hero-demo" aria-label="Example conversation">
            <div className="glow" aria-hidden="true" />
            <div className="demo-card">
              <p className="demo-time">11:48 pm</p>
              <div className="messages">
                {DEMO.map((m, i) =>
                  m.role === 'user' ? (
                    <div className="msg-user" key={i}>{m.text}</div>
                  ) : (
                    <div className="msg-assistant" key={i}>
                      <div className="mark" aria-hidden="true" />
                      <div className="body"><p>{m.text}</p></div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="uses-title">
          <h2 id="uses-title">For the moments that are hard to say out loud</h2>
          <div className="split split-2">
            {USES.map(([title, text]) => (
              <div key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section" aria-labelledby="honest-title">
          <div className="honest">
            <div>
              <h2 id="honest-title">What Lantern is, and what it isn't</h2>
              <p style={{ color: 'var(--ink-soft)', marginTop: '1rem', maxWidth: '44ch' }}>
                We'd rather be clear than oversell. Lantern is a support tool, built to sit alongside the
                people and professionals in your life.
              </p>
            </div>
            <div className="split" style={{ marginTop: 0 }}>
              <div>
                <h3>It is</h3>
                <ul>
                  <li>A patient listener, any time of day</li>
                  <li>A way to untangle thoughts before a hard conversation</li>
                  <li>Quick to show helplines if you mention being unsafe</li>
                </ul>
              </div>
              <div>
                <h3>It isn't</h3>
                <ul>
                  <li>A therapist, doctor or diagnosis</li>
                  <li>A crisis or emergency service</li>
                  <li>Always right. It's an AI and can make mistakes</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <aside className="danger-strip" aria-label="Urgent help">
        <div className="inner">
          <p>
            If you're thinking about ending your life or you're in danger right now, please call
            Tele-MANAS on <a href="tel:14416">14416</a> (free, 24 hours) or emergency services
            on <a href="tel:112">112</a>.
          </p>
          <Link to="/support" style={{ color: 'inherit', fontWeight: 700 }}>More support options</Link>
        </div>
      </aside>

      <footer className="landing-footer">
        <span>Lantern is not a medical service and does not replace professional care.</span>
        <span>&copy; {new Date().getFullYear()} Lantern</span>
      </footer>
    </div>
  )
}
