// Small stroke icon set, drawn on a 24px grid so weights match across the app.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const make = (paths) =>
  function Icon({ size = 20, ...rest }) {
    return (
      <svg {...base} width={size} height={size} {...rest}>
        {paths}
      </svg>
    )
  }

export const MenuIcon = make(<path d="M4 7h16M4 12h16M4 17h10" />)
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)
export const CloseIcon = make(<path d="M6 6l12 12M18 6L6 18" />)
export const TalkIcon = make(
  <path d="M5 18.5V7a2 2 0 012-2h10a2 2 0 012 2v7a2 2 0 01-2 2H8.5L5 18.5z" />,
)
export const MoodIcon = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M8.8 14.2c.9 1 2 1.5 3.2 1.5s2.3-.5 3.2-1.5M9.5 10h.01M14.5 10h.01" />
  </>,
)
export const BreatheIcon = make(
  <path d="M3 9h11a3 3 0 10-3-3M3 13h15a3 3 0 11-3 3M3 17h6" />,
)
export const SupportIcon = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.2" />
    <path d="M6.4 6.4l3.3 3.3M14.3 14.3l3.3 3.3M17.6 6.4l-3.3 3.3M9.7 14.3l-3.3 3.3" />
  </>,
)
export const UserIcon = make(
  <>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 19.5c1.2-3.2 3.8-5 7-5s5.8 1.8 7 5" />
  </>,
)
export const LogoutIcon = make(<path d="M14 5h3a2 2 0 012 2v10a2 2 0 01-2 2h-3M10 16l-4-4 4-4M6 12h9" />)
export const TrashIcon = make(<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />)
export const EditIcon = make(<path d="M5 19h4L19 9l-4-4L5 15v4zM13 7l4 4" />)
export const SendIcon = make(<path d="M12 19V6M6.5 11.5L12 6l5.5 5.5" />)
export const ArrowIcon = make(<path d="M5 12h13M13 7l5 5-5 5" />)
export const PhoneIcon = make(
  <path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 005.5 5.5l1.5-2 4 1.5v3a2 2 0 01-2 2A15 15 0 014.5 6a2 2 0 012-2z" />,
)
export const CheckIcon = make(<path d="M5 12.5l4.5 4.5L19 7.5" />)
