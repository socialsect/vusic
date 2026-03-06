import { useEffect } from 'react'
import { usePlayer } from '../context/PlayerContext'

export function AudioPlayer() {
  const { audioRef, currentTrack, isPlaying, togglePlayPause, playNext, playPrevious } = usePlayer()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.preload = 'auto'
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

  return <audio ref={audioRef} style={{ display: 'none' }} preload="auto" playsInline />
}
