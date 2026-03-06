import { useRef, useState, useCallback, useEffect } from 'react'
import styles from '../styles/ProgressBar.module.css'

export function ProgressBar({ value, max, onSeek, disabled }) {
  const barRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const getPercent = useCallback(
    (e) => {
      if (!barRef.current || !max) return 0
      const rect = barRef.current.getBoundingClientRect()
      const x = e.touches ? e.touches[0].clientX : e.clientX
      const p = (x - rect.left) / rect.width
      return Math.max(0, Math.min(1, p))
    },
    [max]
  )

  const handleStart = (e) => {
    if (disabled) return
    setIsDragging(true)
    const p = getPercent(e)
    onSeek?.(p * max)
  }

  const handleMove = (e) => {
    if (!isDragging || disabled) return
    const p = getPercent(e)
    onSeek?.(p * max)
  }

  const handleEnd = () => setIsDragging(false)

  useEffect(() => {
    if (!isDragging) return
    const onMove = (ev) => {
      const p = getPercent(ev)
      onSeek?.(p * max)
    }
    const onEnd = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, getPercent, max, onSeek])

  const percent = max > 0 ? (value / max) * 100 : 0

  return (
    <div
      ref={barRef}
      className={`${styles.progress} ${isDragging ? styles.dragging : ''} ${disabled ? styles.disabled : ''}`}
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={disabled ? -1 : 0}
    >
      <div className={styles.track}>
        <div className={styles.filled} style={{ width: `${percent}%` }} />
      </div>
      <div
        className={styles.scrubber}
        style={{ left: `${percent}%` }}
      />
    </div>
  )
}
