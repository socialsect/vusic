import { useEffect, useState } from 'react'

// NOTE: This implementation intentionally does NOT use the Web Audio API.
// It only tracks EQ values in state/localStorage so the UI can remain,
// while audio plays natively for best background behaviour on iOS.

export function useEqualizer() {
  const [bands, setBands] = useState({
    bass: 0,
    mid: 0,
    treble: 0
  })

  const initEQ = () => {
    // no-op: native audio only
  }

  const setBand = (band, value) => {
    const clamped = Math.max(-12, Math.min(12, value))

    setBands((prev) => ({ ...prev, [band]: clamped }))

    try {
      const saved = JSON.parse(localStorage.getItem('vusic_eq') || '{}')
      localStorage.setItem('vusic_eq', JSON.stringify({ ...saved, [band]: clamped }))
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('vusic_eq') || '{}')
      setBands((prev) => ({
        bass: typeof saved.bass === 'number' ? saved.bass : prev.bass,
        mid: typeof saved.mid === 'number' ? saved.mid : prev.mid,
        treble: typeof saved.treble === 'number' ? saved.treble : prev.treble
      }))
    } catch {
      // ignore
    }
  }, [])

  const applyBands = () => {
    // no-op: native audio only
  }

  return { bands, setBand, initEQ, applyBands }
}

