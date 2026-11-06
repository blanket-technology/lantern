import { Link } from 'react-router-dom'
import useHelplines, { telHref } from '../hooks/useHelplines.js'
import { CloseIcon, PhoneIcon } from './Icons.jsx'

export default function CrisisBanner({ onDismiss }) {
  const { emergency_number, helplines } = useHelplines()
  const lines = helplines.filter((h) => h.hours.startsWith('24')).slice(0, 2)

  return (
    <section className="crisis" role="alert" aria-labelledby="crisis-title">
      <div className="crisis-head">
        <h2 id="crisis-title">You don't have to get through this alone</h2>
        <button className="icon-btn" onClick={onDismiss} aria-label="Hide support numbers" style={{ width: 32, height: 32 }}>
          <CloseIcon size={16} />
        </button>
      </div>
      <p>
        Trained people are available right now, for free. If you're in immediate danger, call {emergency_number}.
      </p>
      <div className="crisis-lines">
        <a className="pill urgent" href={telHref(emergency_number)}>
          <PhoneIcon size={16} /> Emergency {emergency_number}
        </a>
        {lines.map((h, i) => (
          <a key={h.name} className={`pill${i > 0 ? ' secondary' : ''}`} href={telHref(h.phone)}>
            <PhoneIcon size={16} /> {h.name} {h.phone}
          </a>
        ))}
        <Link to="/support" style={{ alignSelf: 'center', fontSize: 'var(--step--1)', fontWeight: 700 }}>
          More options
        </Link>
      </div>
    </section>
  )
}
