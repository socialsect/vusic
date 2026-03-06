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
  const { audioRef, currentTrack, isPlaying, togglePlayPause, playNext, playPrevious } = usePlayer()
  const unlockAttempted = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
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

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaSession) return

    navigator.mediaSession.metadata = currentTrack
      ? new MediaMetadata({
          title: currentTrack.title || 'Unknown',
          artist: currentTrack.channel || 'Unknown',
          artwork: currentTrack.thumbnail ? [{ src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' }] : []
        })
      : null

    const handlePlay = () => navigator.mediaSession.playbackState = 'playing'
    const handlePause = () => navigator.mediaSession.playbackState = 'paused'

    navigator.mediaSession.setActionHandler('play', () => {
      if (!isPlaying) togglePlayPause()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      if (isPlaying) togglePlayPause()
    })
    navigator.mediaSession.setActionHandler('previoustrack', playPrevious)
    navigator.mediaSession.setActionHandler('nexttrack', playNext)

    audioRef.current?.addEventListener('play', handlePlay)
    audioRef.current?.addEventListener('pause', handlePause)

    return () => {
      audioRef.current?.removeEventListener('play', handlePlay)
      audioRef.current?.removeEventListener('pause', handlePause)
    }
  }, [currentTrack, isPlaying, togglePlayPause, playNext, playPrevious])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.setAttribute('playsinline', 'true')
    audio.setAttribute('webkit-playsinline', 'true')
    audio.setAttribute('x-webkit-airplay', 'allow')
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
