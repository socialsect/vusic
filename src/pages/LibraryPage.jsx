import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { usePlayer } from '../context/PlayerContext'
import { useLikes } from '../context/LikesContext'
import { useToast } from '../context/ToastContext'
import { TrackCard } from '../components/TrackCard'
import { Heart, Plus, Play, Shuffle, Share2, Trash2, Pencil } from 'lucide-react'
import styles from '../styles/LibraryPage.module.css'

const LIBRARY_KEY = 'vusic_library'
const PLAYLISTS_KEY = 'vusic_playlists'

function groupByChannel(tracks) {
  const map = {}
  tracks.forEach((t) => {
    const ch = t.channel || 'Unknown'
    if (!map[ch]) map[ch] = []
    map[ch].push(t)
  })
  return Object.entries(map)
}

export function LibraryPage({ onNavigate }) {
  const [tab, setTab] = useState('liked')
  const [library] = useLocalStorage(LIBRARY_KEY, [])
  const [playlists, setPlaylists] = useLocalStorage(PLAYLISTS_KEY, [])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const { playTrack, setQueue } = usePlayer()
  const { removeFromLibrary } = useLikes()
  const toast = useToast()

  const handlePlayAll = () => {
    if (library.length === 0) return
    playTrack(library[0], library, 0)
    onNavigate('nowplaying')
  }

  const handleShuffleAll = () => {
    if (library.length === 0) return
    const shuffled = [...library].sort(() => Math.random() - 0.5)
    playTrack(shuffled[0], shuffled, 0)
    onNavigate('nowplaying')
  }

  const handleTrackClick = (track) => {
    const list = selectedPlaylist?.tracks || library
    const idx = list.findIndex((t) => t.videoId === track.videoId)
    playTrack(track, list, idx >= 0 ? idx : 0)
    onNavigate('nowplaying')
  }

  const createPlaylist = () => {
    const name = newPlaylistName.trim() || 'New Playlist'
    setPlaylists((prev) => [...prev, { id: Date.now().toString(), name, tracks: [] }])
    setNewPlaylistName('')
    setShowNewPlaylist(false)
  }

  const handleUnlike = (track) => removeFromLibrary(track.videoId)

  const deletePlaylist = (p) => {
    setPlaylists((prev) => prev.filter((x) => x.id !== p.id))
    setSelectedPlaylist(null)
  }

  const sharePlaylist = (p) => {
    const text = p.tracks?.map((t) => t.title).join('\n') || ''
    navigator.clipboard?.writeText(text).then(() => toast('COPIED TO CLIPBOARD ✓'))
  }

  const albums = groupByChannel(library)

  if (selectedPlaylist) {
    const p = selectedPlaylist
    const tracks = p.tracks || []
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backBtn} onClick={() => setSelectedPlaylist(null)}>
          ← BACK
        </button>
        <h2 className={styles.playlistHeader}>{p.name}</h2>
        <div className={styles.playlistActions}>
          <button type="button" className={styles.actionBtn} onClick={() => tracks.length > 0 && (playTrack(tracks[0], tracks, 0), onNavigate('nowplaying'))}>
            <Play size={18} />
            PLAY ALL
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => tracks.length > 0 && (playTrack(tracks[Math.floor(Math.random() * tracks.length)], [...tracks].sort(() => Math.random() - 0.5), 0), onNavigate('nowplaying'))}>
            <Shuffle size={18} />
            SHUFFLE
          </button>
          <button type="button" className={styles.actionBtn} onClick={() => sharePlaylist(p)}>
            <Share2 size={18} />
            SHARE
          </button>
          <button type="button" className={styles.deletePlaylistBtn} onClick={() => deletePlaylist(p)}>
            <Trash2 size={18} />
            DELETE
          </button>
        </div>
        <div className={styles.list}>
          {tracks.map((t) => (
            <div key={t.videoId} className={styles.trackRow}>
              <TrackCard track={t} onClick={() => handleTrackClick(t)} noBorder />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${tab === 'liked' ? styles.tabActive : ''}`} onClick={() => setTab('liked')}>
          LIKED SONGS
        </button>
        <button type="button" className={`${styles.tab} ${tab === 'playlists' ? styles.tabActive : ''}`} onClick={() => setTab('playlists')}>
          PLAYLISTS
        </button>
        <button type="button" className={`${styles.tab} ${tab === 'albums' ? styles.tabActive : ''}`} onClick={() => setTab('albums')}>
          ALBUMS
        </button>
      </div>

      {tab === 'liked' && (
        <>
          <div className={styles.sectionHeader}>
            <span className={styles.count}>{library.length} TRACKS</span>
            <div className={styles.btns}>
              <button type="button" className={styles.playAllBtn} onClick={handlePlayAll}>
                PLAY ALL
              </button>
              <button type="button" className={styles.shuffleBtn} onClick={handleShuffleAll}>
                SHUFFLE
              </button>
            </div>
          </div>
          {library.length > 0 ? (
            <div className={styles.list}>
              {library.map((t) => (
                <div key={t.videoId} className={styles.trackRowWithHeart}>
                  <TrackCard track={t} onClick={() => handleTrackClick(t)} noBorder />
                  <button type="button" className={styles.heartBtn} onClick={() => handleUnlike(t)}>
                    <Heart size={18} fill="currentColor" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>YOUR LIBRARY IS EMPTY</p>
          )}
        </>
      )}

      {tab === 'playlists' && (
        <div className={styles.playlistGrid}>
          <button
            type="button"
            className={styles.newPlaylistCard}
            onClick={() => setShowNewPlaylist(true)}
          >
            <Plus size={32} />
            <span>NEW PLAYLIST</span>
          </button>
          {playlists.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.playlistCard}
              onClick={() => setSelectedPlaylist(p)}
            >
              <div className={styles.playlistCover}>
                {(p.tracks || []).slice(0, 4).map((t, i) => (
                  <img key={i} src={t.thumbnail} alt="" />
                ))}
                {(p.tracks || []).length < 4 && (
                  <div className={styles.coverPlaceholder} />
                )}
              </div>
              <span className={styles.playlistName}>{p.name}</span>
              <span className={styles.playlistCount}>{(p.tracks || []).length} tracks</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'albums' && (
        <>
          {albums.length > 0 ? (
            <div className={styles.albumGrid}>
              {albums.map(([channel, tracks]) => (
                <button
                  key={channel}
                  type="button"
                  className={styles.albumCard}
                  onClick={() => {
                    playTrack(tracks[0], tracks, 0)
                    onNavigate('nowplaying')
                  }}
                >
                  <img src={tracks[0]?.thumbnail} alt="" />
                  <span className={styles.albumName}>{channel}</span>
                  <span className={styles.albumCount}>{tracks.length} tracks</span>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>NO ALBUMS YET</p>
          )}
        </>
      )}

      {showNewPlaylist && (
        <div className={styles.modalBackdrop} onClick={() => setShowNewPlaylist(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className={styles.modalInput}
            />
            <div className={styles.modalBtns}>
              <button type="button" onClick={createPlaylist}>CREATE</button>
              <button type="button" onClick={() => setShowNewPlaylist(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
