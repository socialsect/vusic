import { createContext, useContext, useState, useEffect } from 'react'

const THEMES = {
  MATRIX: { accent: '#c8f135', surface: '#141414' },
  'NEON BLUE': { accent: '#00b4ff', surface: '#0d1520' },
  SYNTHWAVE: { accent: '#ff2d9b', surface: '#120820' },
  INFERNO: { accent: '#ff6b2b', surface: '#150a00' },
  ARCTIC: { accent: '#00ffcc', surface: '#001a14' },
  MONOCHROME: { accent: '#ffffff', surface: '#1a1a1a' }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('vusic_theme') || 'MATRIX'
    } catch {
      return 'MATRIX'
    }
  })

  useEffect(() => {
    const t = THEMES[theme] || THEMES.MATRIX
    const root = document.documentElement
    root.style.setProperty('--accent', t.accent)
    root.style.setProperty('--surface', t.surface)
    try {
      localStorage.setItem('vusic_theme', theme)
    } catch {}
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: Object.keys(THEMES) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { theme: 'MATRIX', setTheme: () => {}, themes: [] }
  return ctx
}
