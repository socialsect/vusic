import { useState, useEffect, useRef } from 'react'
import { Search as SearchIcon } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { usePlayer } from '../context/PlayerContext'
import { SearchResultCard } from '../components/SearchResultCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { PlaylistPickerModal } from '../components/PlaylistPickerModal'
import styles from '../styles/SearchPage.module.css'

const BASE_URL = 'https://vusic-backend-production.up.railway.app'
const CHIPS_KEY = 'vusic_search_chips'
const RECENT_SEARCH_PLAYED_KEY = 'vusic_recent_search_played'
const DEFAULT_CHIPS = ['HIP HOP', 'POP', 'ROCK', 'LOFI', 'JAZZ', 'ELECTRONIC', 'TRENDING']

export function SearchPage({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showRecent, setShowRecent] = useState(false)
  const [playlistModalTrack, setPlaylistModalTrack] = useState(null)
  const [showChipEditor, setShowChipEditor] = useState(false)
  const [chips, setChips] = useLocalStorage(CHIPS_KEY, DEFAULT_CHIPS)
  const [recentSearchPlayed, setRecentSearchPlayed] = useLocalStorage(RECENT_SEARCH_PLAYED_KEY, [])
  const debouncedQuery = useDebounce(query, 500)
  const { playTrack } = usePlayer()
  const doSearchRef = useRef(() => {})

  const doSearch = (q) => {
    if (!q?.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || []
        setResults(items)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }

  doSearchRef.current = doSearch

  useEffect(() => {
    const handler = (e) => {
      const q = e.detail || ''
      setQuery(q)
      if (q?.trim()) doSearchRef.current(q.trim())
    }
    window.addEventListener('vusic-search', handler)
    return () => window.removeEventListener('vusic-search', handler)
  }, [])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    doSearch(debouncedQuery)
  }, [debouncedQuery])

  const handleTrackClick = (track) => {
    setRecentSearchPlayed((prev) => {
      const filtered = (prev || []).filter((t) => t.videoId !== track.videoId)
      const next = [track, ...filtered].slice(0, 20)
      return next
    })
    const artistName = track.channel?.trim()
    if (artistName) {
      fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(artistName)}`)
        .then((r) => r.json())
        .then((data) => {
          const items = data.items || []
          const artistLower = artistName.toLowerCase()
          const sameArtist = items.filter(
            (t) => t.videoId && String(t.channel || '').trim().toLowerCase() === artistLower
          )
          const rest = sameArtist.filter((t) => t.videoId !== track.videoId)
          const queue = [track, ...rest]
          playTrack(track, queue, 0, true)
        })
        .catch(() => {
          playTrack(track, results, results.findIndex((t) => t.videoId === track.videoId), true)
        })
    } else {
      playTrack(track, results, results.findIndex((t) => t.videoId === track.videoId), true)
    }
    onNavigate?.('nowplaying')
  }

  const handleChipClick = (chip) => {
    setQuery(chip)
    doSearch(chip)
  }

  const handleRecentTrackClick = (track) => {
    const list = Array.isArray(recentSearchPlayed) ? recentSearchPlayed : []
    const idx = list.findIndex((t) => t.videoId === track.videoId)
    const index = idx >= 0 ? idx : 0
    playTrack(track, list, index, true)
    setShowRecent(false)
    onNavigate?.('nowplaying')
  }

  const clearRecent = () => setRecentSearchPlayed([])

  return (
    <div className={styles.page}>
      <div className={styles.searchWrap}>
        <SearchIcon size={20} className={styles.searchIcon} />
        <input
          type="search"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowRecent(true)}
          onBlur={() => setTimeout(() => setShowRecent(false), 200)}
          className={styles.input}
        />
      </div>

      <div className={styles.chipsRow}>
        <div className={styles.chips}>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={styles.chip}
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.editChipsBtn}
          onClick={() => setShowChipEditor(true)}
          title="Edit search chips"
        >
          ✎
        </button>
      </div>

      {showRecent && !query && Array.isArray(recentSearchPlayed) && recentSearchPlayed.length > 0 && (
        <div className={styles.recent}>
          <div className={styles.recentHeader}>
            <span className={styles.label}>RECENTLY PLAYED FROM SEARCH</span>
            <button type="button" className={styles.clearBtn} onClick={clearRecent}>
              ✕
            </button>
          </div>
          <ul className={styles.recentList}>
            {recentSearchPlayed.slice(0, 10).map((track) => (
              <li key={track.videoId}>
                <button
                  type="button"
                  className={styles.recentTrackItem}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleRecentTrackClick(track) }}
                >
                  <img src={track.thumbnail || ''} alt="" className={styles.recentThumb} />
                  <div className={styles.recentTrackInfo}>
                    <span className={styles.recentTrackTitle}>{track.title || 'Unknown'}</span>
                    <span className={styles.recentTrackChannel}>{track.channel || 'Unknown'}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.results}>
        {loading && (
          <>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </>
        )}
        {!loading && results.length > 0 && (
          <div className={styles.list}>
            {results.map((track) => (
              <SearchResultCard
                key={track.videoId}
                track={track}
                onClick={handleTrackClick}
                onAddToPlaylist={(t) => setPlaylistModalTrack(t)}
              />
            ))}
          </div>
        )}
        {!loading && debouncedQuery && results.length === 0 && (
          <p className={styles.empty}>No results</p>
        )}
      </div>

      {playlistModalTrack && (
        <PlaylistPickerModal
          track={playlistModalTrack}
          onClose={() => setPlaylistModalTrack(null)}
        />
      )}

      {showChipEditor && (
        <ChipEditorModal
          chips={chips}
          setChips={setChips}
          defaultChips={DEFAULT_CHIPS}
          onClose={() => setShowChipEditor(false)}
        />
      )}
    </div>
  )
}

function ChipEditorModal({ chips, setChips, defaultChips, onClose }) {
  const [newChip, setNewChip] = useState('')

  const addChip = () => {
    const t = newChip.trim().toUpperCase()
    if (t && !chips.includes(t)) {
      setChips([...chips, t])
      setNewChip('')
    }
  }

  const removeChip = (chip) => setChips(chips.filter((c) => c !== chip))

  const resetToDefault = () => setChips([...defaultChips])

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.chipEditorModal} onClick={(e) => e.stopPropagation()}>
        <h3>EDIT SEARCH CHIPS</h3>
        <div className={styles.chipEditorAdd}>
          <input
            type="text"
            placeholder="Add chip..."
            value={newChip}
            onChange={(e) => setNewChip(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addChip()}
          />
          <button type="button" onClick={addChip}>ADD</button>
        </div>
        <ul className={styles.chipEditorList}>
          {chips.map((chip) => (
            <li key={chip}>
              <span>{chip}</span>
              <button type="button" onClick={() => removeChip(chip)}>✕</button>
            </li>
          ))}
        </ul>
        <button type="button" className={styles.resetChipsBtn} onClick={resetToDefault}>
          RESET TO DEFAULT
        </button>
        <button type="button" className={styles.closeChipEditor} onClick={onClose}>
          DONE
        </button>
      </div>
    </div>
  )
}
