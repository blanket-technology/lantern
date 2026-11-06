import { useEffect, useRef, useState } from 'react'

const PATTERNS = {
  calm: {
    name: 'Slow exhale',
    about: 'In for 4, out for 6. A longer out-breath helps your body settle.',
    phases: [['Breathe in', 4], ['Breathe out', 6]],
  },
  box: {
    name: 'Box breathing',
    about: 'Four equal sides of 4 seconds. Steady and easy to remember.',
    phases: [['Breathe in', 4], ['Hold', 4], ['Breathe out', 4], ['Hold', 4]],
  },
  relax: {
    name: '4-7-8',
    about: 'In for 4, hold for 7, out for 8. Many people use it to wind down before sleep.',
    phases: [['Breathe in', 4], ['Hold', 7], ['Breathe out', 8]],
  },
}

const scaleFor = (label, prevScale) =>
  label === 'Breathe in' ? 1 : label === 'Breathe out' ? 0.45 : prevScale

export default function BreathePage() {
  const [key, setKey] = useState('calm')
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [cycles, setCycles] = useState(0)
  const [scale, setScale] = useState(0.45)
  const timer = useRef(null)

  const pattern = PATTERNS[key]
  const [label, seconds] = pattern.phases[phase]

  useEffect(() => {
    if (!running) return
    setScale((s) => scaleFor(label, s))
    setRemaining(seconds)
    const started = Date.now()
    timer.current = setInterval(() => {
      const left = seconds - Math.floor((Date.now() - started) / 1000)
      if (left <= 0) {
        clearInterval(timer.current)
        const next = (phase + 1) % pattern.phases.length
        if (next === 0) setCycles((c) => c + 1)
        setPhase(next)
      } else {
        setRemaining(left)
      }
    }, 200)
    return () => clearInterval(timer.current)
  }, [running, phase, key, label, seconds, pattern.phases.length])

  const stop = () => {
    setRunning(false)
    setPhase(0)
    setScale(0.45)
  }

  const choose = (k) => {
    stop()
    setCycles(0)
    setKey(k)
  }

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-head">
          <h1>Breathe with the light</h1>
          <p>Follow the glow as it grows and shrinks. A few minutes is enough. If you feel lightheaded, stop and breathe normally.</p>
        </header>

        <div className="panel" style={{ marginTop: '2rem' }}>
          <div className="patterns" role="group" aria-label="Breathing pattern">
            {Object.entries(PATTERNS).map(([k, p]) => (
              <button key={k} className="chip" aria-pressed={key === k} onClick={() => choose(k)}>
                {p.name}
              </button>
            ))}
          </div>
          <p className="panel-sub" style={{ textAlign: 'center', marginTop: '0.75rem' }}>{pattern.about}</p>

          <div className="breathe-stage">
            <div className="breath-ring">
              <div
                className="breath-orb"
                style={{ transform: `scale(${scale})`, transitionDuration: `${running ? seconds : 0.6}s` }}
                aria-hidden="true"
              />
              <div className="breath-label" aria-live="polite">
                <strong>{running ? label : 'Ready'}</strong>
                <span>{running ? `${remaining}` : 'Press start when you are'}</span>
              </div>
            </div>
          </div>

          <div className="breathe-controls">
            {running ? (
              <button className="btn btn-quiet" onClick={stop}>Stop</button>
            ) : (
              <button className="btn btn-primary" onClick={() => setRunning(true)}>Start</button>
            )}
            <span className="count">
              {cycles === 0 ? 'Try five rounds to start' : `${cycles} ${cycles === 1 ? 'round' : 'rounds'} done`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
