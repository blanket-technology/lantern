import { PhoneIcon } from '../components/Icons.jsx'
import useHelplines, { telHref } from '../hooks/useHelplines.js'

export default function SupportPage() {
  const { emergency_number, international_directory, helplines } = useHelplines()

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-head">
          <h1>Talk to a person</h1>
          <p>
            Lantern can listen, but some moments need a trained human. These services are free and
            confidential. You don't need to be in crisis to call.
          </p>
        </header>

        <div className="stack">
          <div className="emergency" role="region" aria-label="Emergency">
            <p>
              <strong>In immediate danger, or already hurt?</strong>
              <br />
              Call emergency services or go to the nearest hospital.
            </p>
            <a className="btn" href={telHref(emergency_number)}>
              <PhoneIcon size={18} /> Call {emergency_number}
            </a>
          </div>

          <section className="panel" aria-labelledby="lines-title">
            <h2 id="lines-title">Helplines in India</h2>
            <p className="panel-sub">
              Outside India? <a href={international_directory} target="_blank" rel="noreferrer">Find a free helpline in your country</a>.
            </p>
            <div className="lines">
              {helplines.map((h) => (
                <article className="line" key={h.name}>
                  <h3>
                    {h.url ? <a href={h.url} target="_blank" rel="noreferrer">{h.name}</a> : h.name}
                  </h3>
                  <span className="hours">{h.hours}</span>
                  <p>{h.description}</p>
                  <a className="btn btn-quiet call" href={telHref(h.phone)} aria-label={`Call ${h.name} on ${h.phone}`}>
                    <PhoneIcon size={16} /> {h.phone}
                  </a>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" aria-labelledby="ground-title">
            <h2 id="ground-title">If everything feels too fast right now</h2>
            <p className="panel-sub">This grounding exercise brings your attention back to the room you're in. Go slowly.</p>
            <ol className="steps">
              <li>Look around and name <strong>five</strong> things you can see.</li>
              <li>Notice <strong>four</strong> things you can feel, like your feet on the floor or the fabric of your clothes.</li>
              <li>Listen for <strong>three</strong> things you can hear.</li>
              <li>Find <strong>two</strong> things you can smell, or two scents you like.</li>
              <li>Name <strong>one</strong> thing you can taste, or one kind thing about yourself.</li>
            </ol>
          </section>

          <section className="panel prose" aria-labelledby="when-title">
            <h2 id="when-title">When to see a professional</h2>
            <p style={{ marginTop: '0.75rem' }}>
              If low mood, worry or trouble sleeping has lasted more than two weeks, or it's getting in
              the way of work, study or relationships, it's a good time to talk to a doctor or counsellor.
              Many colleges and workplaces offer free sessions.
            </p>
            <p>
              Reaching out isn't a sign that something is wrong with you. It's the same as seeing a doctor
              for a fever that won't go away.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
