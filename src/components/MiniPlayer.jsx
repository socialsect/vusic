import { SkipForward, Play, Pause } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import styles from '../styles/MiniPlayer.module.css'

export function MiniPlayer({ onNavigate }) {
  const { currentTrack, isPlaying, currentTime, duration, togglePlayPause, playNext } = usePlayer()

  if (!currentTrack) return null

  const percent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <button
      type="button"
      className={styles.mini}
      onClick={() => onNavigate?.('nowplaying')}
    >
      <div className={styles.progressBar} style={{ width: `${percent}%` }} />
      <img src={currentTrack.thumbnail} alt="" className={styles.thumb} />
      <span className={styles.title}>{currentTrack.title || 'Unknown'}</span>
      <div className={styles.controls} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={styles.btn}
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button type="button" className={styles.btn} onClick={playNext} aria-label="Next">
          <SkipForward size={20} />
        </button>
      </div>
    </button>
  )
}
