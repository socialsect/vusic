import { useLocalStorage } from '../hooks/useLocalStorage'
import { useToast } from '../context/ToastContext'
import styles from '../styles/PlaylistPickerModal.module.css'

const PLAYLISTS_KEY = 'vusic_playlists'

export function PlaylistPickerModal({ track, onClose }) {
  const [playlists, setPlaylists] = useLocalStorage(PLAYLISTS_KEY, [])
  const toast = useToast()

  const addToPlaylist = (playlist) => {
    if (!track?.videoId) return
    const updated = playlists.map((p) => {
      if (p.id !== playlist.id) return p
      const exists = p.tracks?.some((t) => t.videoId === track.videoId)
      if (exists) return p
      return { ...p, tracks: [...(p.tracks || []), track] }
    })
    setPlaylists(updated)
    toast('ADDED TO PLAYLIST ✓')
    onClose?.()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>ADD TO PLAYLIST</h3>
        {playlists.length === 0 ? (
          <p className={styles.empty}>No playlists yet. Create one in Library.</p>
        ) : (
          <ul className={styles.list}>
            {playlists.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => addToPlaylist(p)}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          CANCEL
        </button>
      </div>
    </div>
  )
}
