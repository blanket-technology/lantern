import { useMemo } from 'react'
import { dayKey, MOODS, moodFor } from '../lib/moods.js'

const W = 640
const H = 220
const PAD = { top: 12, right: 12, bottom: 28, left: 56 }

/** Daily average mood over the last `days` days, with every check-in as a dot. */
export default function MoodChart({ entries, days = 30 }) {
  const { points, dots, ticks } = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const x = (i) => PAD.left + (innerW * i) / (days - 1)
    const y = (score) => PAD.top + innerH - ((score - 1) / 4) * innerH

    const byDay = new Map()
    for (const e of entries) {
      const k = dayKey(e.created_at)
      byDay.set(k, [...(byDay.get(k) || []), e.score])
    }

    const pts = []
    const ds = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const scores = byDay.get(dayKey(d))
      if (!scores) continue
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      pts.push([x(i), y(avg)])
      scores.forEach((s, j) => ds.push({ cx: x(i), cy: y(s), color: moodFor(s).color, key: `${i}-${j}` }))
    }

    const label = (offset) => {
      const d = new Date(start)
      d.setDate(start.getDate() + offset)
      return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
    }
    const tk = [0, Math.floor((days - 1) / 2), days - 1].map((i) => ({ x: x(i), text: i === days - 1 ? 'Today' : label(i) }))
    return { points: pts, dots: ds, ticks: { x: tk, y: MOODS.map((m) => ({ y: y(m.score), text: m.label })) } }
  }, [entries, days])

  if (dots.length === 0) {
    return <p className="chart-empty">Your check-ins from the last {days} days will be charted here.</p>
  }

  const line = points.map(([px, py]) => `${px},${py}`).join(' ')
  const baseY = H - PAD.bottom
  const area = points.length > 1 ? `${points[0][0]},${baseY} ${line} ${points.at(-1)[0]},${baseY}` : null
  const avg = (entries.reduce((a, e) => a + e.score, 0) / entries.length).toFixed(1)

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mood over the last ${days} days. ${entries.length} check-ins, average ${avg} out of 5.`}>
      {ticks.y.map((t) => (
        <g key={t.text}>
          <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} />
          <text className="axis-label" x={PAD.left - 10} y={t.y + 4} textAnchor="end">{t.text}</text>
        </g>
      ))}
      {ticks.x.map((t, i) => (
        <text key={i} className="axis-label" x={t.x} y={H - 8} textAnchor={i === 0 ? 'start' : i === 2 ? 'end' : 'middle'}>
          {t.text}
        </text>
      ))}
      {area && <polygon className="area" points={area} />}
      {points.length > 1 && <polyline className="trend" points={line} />}
      {dots.map((d) => (
        <circle key={d.key} cx={d.cx} cy={d.cy} r="5" fill={d.color} stroke="var(--paper)" strokeWidth="2" />
      ))}
    </svg>
  )
}
