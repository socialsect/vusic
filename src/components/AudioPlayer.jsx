import { useEffect, useRef } from 'react'
import { usePlayer } from '../context/PlayerContext'

let iOSUnlocked = false

function unlockiOSAudio(audioEl) {
  if (!audioEl || iOSUnlocked) return
  audioEl.play().then(() => {
    audioEl.pause()
    iOSUnlocked = true
  }).catch(() => {})
}

export function AudioPlayer() {
  const { audioRef } = usePlayer()
  const unlockAttempted = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.setAttribute('playsinline', '')
    audio.setAttribute('webkit-playsinline', '')
    audio.setAttribute('x-webkit-airplay', 'allow')
    audio.preload = 'auto'
  }, [])

  useEffect(() => {
    const handleFirstUserGesture = () => {
      if (unlockAttempted.current) return
      unlockAttempted.current = true
      unlockiOSAudio(audioRef.current)
      document.removeEventListener('click', handleFirstUserGesture)
      document.removeEventListener('touchstart', handleFirstUserGesture)
    }
    document.addEventListener('click', handleFirstUserGesture, { once: true })
    document.addEventListener('touchstart', handleFirstUserGesture, { once: true })
    return () => {
      document.removeEventListener('click', handleFirstUserGesture)
      document.removeEventListener('touchstart', handleFirstUserGesture)
    }
  }, [])

  return (
    <audio
      ref={audioRef}
      style={{ display: 'none' }}
      preload="auto"
      playsInline
    />
  )
}
