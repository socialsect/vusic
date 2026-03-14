import { useState, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { usePlayer } from '../context/PlayerContext'
import { useLikes } from '../context/LikesContext'
import { TrackCard } from '../components/TrackCard'
import { Heart } from 'lucide-react'
import styles from '../styles/HomePage.module.css'

const HISTORY_KEY = 'vusic_history'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'GOOD MORNING'
  if (h < 17) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
}

export function HomePage({ onNavigate }) {
  const [history] = useLocalStorage(HISTORY_KEY, [])
  const [discoverTracks, setDiscoverTracks] = useState([])
  const [discoverLabel, setDiscoverLabel] = useState('')
  const { playTrack, fetchRecommendations, BASE_URL } = usePlayer()
  const { isLiked, toggleLike } = useLikes()

  const continueTracks = history.slice(0, 6)
  const madeForYouTracks = history.slice(0, 10)
  const recentTracks = history.slice(0, 20)

  useEffect(() => {
    if (history.length === 0) return
    const last = history[0]
    const artist = last?.channel || ''
    const trackTitle = last?.title || ''
    if (!artist.trim()) return
    setDiscoverLabel(trackTitle ? `BECAUSE YOU PLAYED ${(trackTitle.length > 30 ? trackTitle.slice(0, 30) + '...' : trackTitle).toUpperCase()}` : 'DISCOVER')
    fetchRecommendations(artist, { appendToQueue: false, showToasts: false }).then((tracks) => {
      if (tracks && tracks.length > 0) {
        setDiscoverTracks(tracks.slice(0, 10))
      } else {
        fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(artist)}`)
          .then((r) => r.json())
          .then((data) => setDiscoverTracks((data.items || []).slice(0, 10)))
          .catch(() => setDiscoverTracks([]))
      }
    }).catch(() => {
        fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(artist)}`)
        .then((r) => r.json())
        .then((data) => setDiscoverTracks((data.items || []).slice(0, 10)))
        .catch(() => setDiscoverTracks([]))
    })
  }, [history.length, history[0]?.videoId, history[0]?.channel, fetchRecommendations, BASE_URL])

  const handleTrackClick = (track) => {
    const idx = history.findIndex((t) => t.videoId === track.videoId)
    playTrack(track, history, idx >= 0 ? idx : 0, true)
    onNavigate('nowplaying')
  }

  const handleMadeForYou = () => {
    if (madeForYouTracks.length === 0) return
    playTrack(madeForYouTracks[0], madeForYouTracks, 0, true)
    onNavigate('nowplaying')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.greeting}>{getGreeting()}</h1>
        <p className={styles.subtitle}>What are we listening to today?</p>
      </header>

      {continueTracks.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>CONTINUE LISTENING</h2>
          <div className={styles.hScroll}>
            {continueTracks.map((t) => (
              <button
                key={t.videoId}
                type="button"
                className={styles.continueCard}
                onClick={() => handleTrackClick(t)}
              >
                <img src={t.thumbnail} alt="" />
                <span className={styles.continueTitle}>{t.title}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {madeForYouTracks.length >= 3 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>MADE FOR YOU</h2>
          <button type="button" className={styles.madeForYou} onClick={handleMadeForYou}>
            <span className={styles.madeTitle}>MADE FOR YOU</span>
            <span className={styles.madeSub}>Based on your listening</span>
          </button>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>RECENTLY PLAYED</h2>
        {recentTracks.length > 0 ? (
          <div className={styles.list}>
            {recentTracks.map((t) => (
              <div key={t.videoId} className={styles.recentRow}>
                <div className={styles.recentCard}>
                  <TrackCard track={t} onClick={() => handleTrackClick(t)} noBorder />
                </div>
                <button
                  type="button"
                  className={`${styles.heartBtn} ${isLiked(t.videoId) ? styles.liked : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(t)
                  }}
                >
                  <Heart size={18} fill={isLiked(t.videoId) ? 'currentColor' : 'none'} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Nothing played yet. Search something.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {history.length > 0 && discoverLabel
            ? discoverLabel
            : 'DISCOVER'}
        </h2>
        {history.length > 0 && discoverTracks.length > 0 ? (
          <div className={styles.hScroll}>
            {discoverTracks.map((t) => (
              <button
                key={t.videoId}
                type="button"
                className={styles.continueCard}
                onClick={() => handleTrackClick(t)}
              >
                <img src={t.thumbnail} alt="" />
                <span className={styles.continueTitle}>{t.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Search something to get recommendations</p>
        )}
      </section>
    </div>
  )
}
