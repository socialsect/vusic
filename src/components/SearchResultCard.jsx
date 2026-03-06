import { useState } from 'react'
import { Heart, MoreVertical } from 'lucide-react'
import { useLikes } from '../context/LikesContext'
import { usePlayer } from '../context/PlayerContext'
import { useToast } from '../context/ToastContext'
import styles from '../styles/SearchResultCard.module.css'

export function SearchResultCard({ track, onClick, onAddToPlaylist }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isLiked, toggleLike, addToLibrary } = useLikes()
  const { addToQueue } = usePlayer()
  const toast = useToast()

  const liked = isLiked(track.videoId)

  const handleAddToQueue = (e) => {
    e.stopPropagation()
    addToQueue(track)
    toast('ADDED TO QUEUE ✓')
    setMenuOpen(false)
  }

  const handleSaveToLibrary = (e) => {
    e.stopPropagation()
    addToLibrary(track)
    toast('ADDED TO LIBRARY ✓')
    setMenuOpen(false)
  }

  const handleAddToPlaylist = (e) => {
    e.stopPropagation()
    onAddToPlaylist?.(track)
    setMenuOpen(false)
  }

  const handleLike = (e) => {
    e.stopPropagation()
    toggleLike(track)
  }

  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.card} onClick={() => onClick?.(track)}>
        <div className={styles.thumbWrap}>
          <img src={track.thumbnail || ''} alt="" className={styles.thumb} />
        </div>
        <div className={styles.info}>
          <div className={styles.title}>{track.title || 'Unknown'}</div>
          <div className={styles.meta}>
            <span className={styles.channel}>{track.channel || 'Unknown'}</span>
            {track.duration ? (
              <span className={styles.duration}>{track.duration}</span>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className={`${styles.heartBtn} ${liked ? styles.liked : ''}`}
          onClick={handleLike}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
        </button>
        <div className={styles.menuWrap}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div
                className={styles.menuBackdrop}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
              />
              <div className={styles.menu}>
                <button type="button" onClick={handleAddToQueue}>Add to Queue</button>
                <button type="button" onClick={handleSaveToLibrary}>Save to Library</button>
                <button type="button" onClick={handleAddToPlaylist}>Add to Playlist</button>
              </div>
            </>
          )}
        </div>
      </button>
    </div>
  )
}
