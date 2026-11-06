export const MOODS = [
  { score: 1, label: 'Rough', color: '#B0465C' },
  { score: 2, label: 'Low', color: '#C7845A' },
  { score: 3, label: 'Okay', color: '#9A9CB0' },
  { score: 4, label: 'Good', color: '#5E9A82' },
  { score: 5, label: 'Bright', color: '#F3B23C' },
]

export const TAGS = ['sleep', 'work', 'study', 'family', 'friends', 'health', 'money', 'love', 'alone', 'outdoors']

export const moodFor = (score) => MOODS[Math.min(Math.max(Math.round(score), 1), 5) - 1]

export function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatWhen(iso) {
  const d = new Date(iso)
  const today = dayKey(new Date())
  const yesterday = dayKey(new Date(Date.now() - 86400000))
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (dayKey(d) === today) return `Today, ${time}`
  if (dayKey(d) === yesterday) return `Yesterday, ${time}`
  return `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${time}`
}
