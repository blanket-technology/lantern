import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { TrashIcon } from '../components/Icons.jsx'
import MoodChart from '../components/MoodChart.jsx'
import { dayKey, formatWhen, MOODS, moodFor, TAGS } from '../lib/moods.js'

function streak(entries) {
  const days = new Set(entries.map((e) => dayKey(e.created_at)))
  let count = 0
  const d = new Date()
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1) // today not logged yet doesn't break it
  while (days.has(dayKey(d))) {
    count++
    d.setDate(d.getDate() - 1)
  }
  return count
}

export default function MoodPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(null)
  const [tags, setTags] = useState([])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.moods(30).then(setEntries).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const toggleTag = (t) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const submit = async (e) => {
    e.preventDefault()
    if (!score) return
    setSaving(true)
    setError('')
    try {
      const entry = await api.addMood({ score, tags, note: note.trim() || null })
      setEntries((prev) => [entry, ...prev])
      setScore(null)
      setTags([])
      setNote('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this check-in?')) return
    try {
      await api.deleteMood(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  const summary = useMemo(() => {
    if (!entries.length) return null
    const avg = entries.reduce((a, e) => a + e.score, 0) / entries.length
    const counts = {}
    entries.flatMap((e) => e.tags).forEach((t) => (counts[t] = (counts[t] || 0) + 1))
    const topTag = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
    return { avg, topTag, streak: streak(entries) }
  }, [entries])

  const lowWeek = useMemo(() => {
    const recent = entries.filter((e) => Date.now() - new Date(e.created_at) < 7 * 86400000)
    return recent.length >= 3 && recent.every((e) => e.score <= 2)
  }, [entries])

  return (
    <div className="page">
      <div className="page-inner">
        <header className="page-head">
          <h1>How are you, right now?</h1>
          <p>A quick check-in takes ten seconds. Over a few weeks, it shows you patterns that are hard to notice day to day.</p>
        </header>

        <div className="stack">
          <form className="panel" onSubmit={submit}>
            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="visually-hidden">Pick your mood</legend>
              <div className="mood-scale">
                {MOODS.map((m) => (
                  <button
                    key={m.score}
                    type="button"
                    className="mood-option"
                    aria-pressed={score === m.score}
                    onClick={() => setScore(m.score)}
                  >
                    <i className="mood-dot" style={{ background: m.color }} aria-hidden="true" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mood-form">
              <div className="field">
                <span id="tags-label" style={{ fontWeight: 700, fontSize: 'var(--step--1)' }}>What's it connected to? (optional)</span>
                <div className="chips" role="group" aria-labelledby="tags-label">
                  {TAGS.map((t) => (
                    <button key={t} type="button" className="chip" aria-pressed={tags.includes(t)} onClick={() => toggleTag(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="mood-note">A line about today (optional)</label>
                <textarea
                  id="mood-note"
                  className="textarea"
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's behind the feeling?"
                />
              </div>
              {error && <div className="form-error" role="alert">{error}</div>}
              <div className="row">
                {saved && <span className="saved-note" role="status">Check-in saved</span>}
                <button className="btn btn-primary" disabled={!score || saving}>
                  {saving ? <span className="spinner" /> : null} Save check-in
                </button>
              </div>
            </div>
          </form>

          {lowWeek && (
            <div className="panel" style={{ borderColor: 'color-mix(in srgb, var(--rose) 40%, var(--line))' }}>
              <h2>It's been a hard week</h2>
              <p className="panel-sub" style={{ fontSize: 'var(--step-0)' }}>
                Your recent check-ins have mostly been low. That's worth taking seriously. Talking to a
                counsellor, doctor or someone you trust can help, and <Link to="/support">free support lines</Link> are
                open if you want to talk to someone today.
              </p>
            </div>
          )}

          <section className="panel" aria-labelledby="trend-title">
            <h2 id="trend-title">The last 30 days</h2>
            {summary && (
              <div className="stats">
                <div className="stat">
                  <div className="value">{moodFor(summary.avg).label}</div>
                  <div className="label">Average, {summary.avg.toFixed(1)} of 5</div>
                </div>
                <div className="stat">
                  <div className="value">{entries.length}</div>
                  <div className="label">{entries.length === 1 ? 'Check-in' : 'Check-ins'}</div>
                </div>
                <div className="stat">
                  <div className="value">{summary.streak}</div>
                  <div className="label">{summary.streak === 1 ? 'Day in a row' : 'Days in a row'}</div>
                </div>
              </div>
            )}
            {loading ? <p className="chart-empty">Loading…</p> : <MoodChart entries={entries} />}
            {summary?.topTag && (
              <p className="panel-sub" style={{ marginTop: '1rem' }}>
                Most often linked to <strong>{summary.topTag}</strong>.
              </p>
            )}
          </section>

          {entries.length > 0 && (
            <section className="panel" aria-labelledby="history-title">
              <h2 id="history-title">Recent check-ins</h2>
              <ul className="history">
                {entries.slice(0, 20).map((e) => {
                  const m = moodFor(e.score)
                  return (
                    <li key={e.id}>
                      <i className="dot" style={{ background: m.color }} aria-hidden="true" />
                      <div>
                        <div>
                          <strong>{m.label}</strong> <span className="meta">{formatWhen(e.created_at)}</span>
                        </div>
                        {e.tags.length > 0 && <div className="tags">{e.tags.join(', ')}</div>}
                        {e.note && <p className="note">{e.note}</p>}
                      </div>
                      <button className="icon-btn" onClick={() => remove(e.id)} aria-label="Delete check-in">
                        <TrashIcon size={16} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
