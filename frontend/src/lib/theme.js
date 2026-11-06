const KEY = 'lantern.theme'

export function getTheme() {
  try {
    return localStorage.getItem(KEY) || 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage unavailable */
  }
}
