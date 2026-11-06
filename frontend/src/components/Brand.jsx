import { Link } from 'react-router-dom'

export function LanternMark({ size = 30 }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="lantern-glow" cx="50%" cy="58%" r="50%">
          <stop offset="0" stopColor="#FFE3A3" />
          <stop offset="0.55" stopColor="#F3B23C" />
          <stop offset="1" stopColor="#F3B23C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="38" r="22" fill="url(#lantern-glow)" />
      <path
        d="M24 22h16M26 22c0-5 2.5-8 6-8s6 3 6 8M23 22l3 24h12l3-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand" aria-label="Lantern home">
      <LanternMark />
      <span className="brand-name">Lantern</span>
    </Link>
  )
}
