import { useEffect } from 'react'

export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlers.playPause?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          handlers.seekForward?.()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlers.seekBack?.()
          break
        case 'KeyN':
          handlers.next?.()
          break
        case 'KeyP':
          handlers.previous?.()
          break
        case 'KeyL':
          handlers.like?.()
          break
        case 'KeyM':
          handlers.mute?.()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
