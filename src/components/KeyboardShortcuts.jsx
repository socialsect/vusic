import { usePlayer } from '../context/PlayerContext'
import { useLikes } from '../context/LikesContext'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

export function KeyboardShortcuts({ currentTrack }) {
  const { togglePlayPause, seek, playNext, playPrevious, setVolume } = usePlayer()
  const { isLiked, toggleLike } = useLikes()

  useKeyboardShortcuts({
    playPause: togglePlayPause,
    seekForward: () => seek(10),
    seekBack: () => seek(-10),
    next: playNext,
    previous: playPrevious,
    like: currentTrack ? () => toggleLike(currentTrack) : undefined,
    mute: () => {
      const v = document.querySelector('audio')?.volume ?? 0.8
      setVolume(v > 0 ? 0 : 0.8)
    }
  })

  return null
}
