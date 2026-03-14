import { useRef, useEffect, useState } from 'react'

export function useEqualizer(audioRef) {
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const bassFilterRef = useRef(null)
  const midFilterRef = useRef(null)
  const trebleFilterRef = useRef(null)
  const gainRef = useRef(null)

  const [bands, setBands] = useState({
    bass: 0,
    mid: 0,
    treble: 0
  })

  const sourceCreatedRef = useRef(false)

  const initEQ = () => {
    if (sourceCreatedRef.current || !audioRef.current) return

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      const ctx = new AudioContext()
      audioCtxRef.current = ctx

      // iOS: ensure crossOrigin is set before creating source
      try {
        if (audioRef.current) {
          audioRef.current.crossOrigin = 'anonymous'
        }
      } catch {
        // ignore
      }

      const source = ctx.createMediaElementSource(audioRef.current)
      sourceRef.current = source
      sourceCreatedRef.current = true

      const bass = ctx.createBiquadFilter()
      bass.type = 'lowshelf'
      bass.frequency.value = 200
      bass.gain.value = 0
      bassFilterRef.current = bass

      const mid = ctx.createBiquadFilter()
      mid.type = 'peaking'
      mid.frequency.value = 1000
      mid.Q.value = 1
      mid.gain.value = 0
      midFilterRef.current = mid

      const treble = ctx.createBiquadFilter()
      treble.type = 'highshelf'
      treble.frequency.value = 8000
      treble.gain.value = 0
      trebleFilterRef.current = treble

      const gain = ctx.createGain()
      gain.gain.value = 1
      gainRef.current = gain

      source.connect(bass)
      bass.connect(mid)
      mid.connect(treble)
      treble.connect(gain)
      gain.connect(ctx.destination)

      // resume on first gesture if needed
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      applyBands()
      // eslint-disable-next-line no-console
      console.log('[EQ] initialized')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[EQ] init error:', err)
    }
  }

  const setBand = (band, value) => {
    const clamped = Math.max(-12, Math.min(12, value))

    if (band === 'bass' && bassFilterRef.current) {
      bassFilterRef.current.gain.value = clamped
    }
    if (band === 'mid' && midFilterRef.current) {
      midFilterRef.current.gain.value = clamped
    }
    if (band === 'treble' && trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = clamped
    }

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
    try {
      const saved = JSON.parse(localStorage.getItem('vusic_eq') || '{}')
      if (bassFilterRef.current && typeof saved.bass === 'number') {
        bassFilterRef.current.gain.value = saved.bass
      }
      if (midFilterRef.current && typeof saved.mid === 'number') {
        midFilterRef.current.gain.value = saved.mid
      }
      if (trebleFilterRef.current && typeof saved.treble === 'number') {
        trebleFilterRef.current.gain.value = saved.treble
      }
    } catch {
      // ignore
    }
  }

  // Handle iOS background/foreground behaviour for Web Audio
  useEffect(() => {
    const handleVisibility = () => {
      const ctx = audioCtxRef.current
      const source = sourceRef.current
      const bass = bassFilterRef.current
      const gain = gainRef.current

      if (!ctx || !source) return

      if (document.visibilityState === 'hidden') {
        // In background: bypass EQ so native audio can keep playing
        try {
          source.disconnect()
          source.connect(ctx.destination)
        } catch {
          // ignore
        }
      } else {
        // Foreground: resume context and reconnect full EQ chain
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {})
        }
        try {
          source.disconnect()
          if (bass && gain) {
            source.connect(bass)
          }
        } catch {
          // ignore
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return { bands, setBand, initEQ, applyBands }
}

