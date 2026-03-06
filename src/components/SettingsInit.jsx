import { useEffect } from 'react'

const FONT_SIZES = { small: 14, medium: 16, large: 18 }

export function SettingsInit() {
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('vusic_settings') || '{}')
      const fs = s.fontSize || 'medium'
      document.documentElement.style.fontSize = (FONT_SIZES[fs] || 16) + 'px'
    } catch {}
  }, [])
  return null
}
