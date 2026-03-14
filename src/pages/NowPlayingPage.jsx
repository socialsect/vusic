import { useState, useRef, useEffect } from 'react'
import {
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  Heart,
  MoreVertical,
  ChevronLeft,
  Loader2,
  Library,
  List
} from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useLikes } from '../context/LikesContext'
import { useToast } from '../context/ToastContext'
import { ProgressBar } from '../components/ProgressBar'
import { Equalizer } from '../components/Equalizer'
import { PlaylistPickerModal } from '../components/PlaylistPickerModal'
import styles from '../styles/NowPlayingPage.module.css'

function formatTime(secs) {
  if (secs == null || !Number.isFinite(secs) || Number.isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatSleepTime(sec) {
  if (sec == null || !Number.isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function NowPlayingPage({ onNavigate }) {
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [queueOpen, setQueueOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [sleepPickerOpen, setSleepPickerOpen] = useState(false)
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false)
  const touchStart = useRef({ x: 0, y: 0 })

  const {
    audioRef,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    loop,
    shuffle,
    buffering,
    streamError,
    preparingTrack,
    loadTimeout,
    welcomeBack,
    setLoadTimeout,
    queue,
    queueIndex,
    togglePlayPause,
    seek,
    seekTo,
    setVolume,
    setLoop,
    setShuffle,
    playNext,
    playPrevious,
    setStreamError,
    playTrack,
    addToQueue,
    jumpToQueueIndex,
    recentHistory,
    sleepTimerSeconds,
    setSleepTimerSeconds,
    bands
  } = usePlayer()

  const { isLiked, toggleLike, addToLibrary } = useLikes()
  const titleRef = useRef(null)
  const [titleOverflow, setTitleOverflow] = useState(false)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    const check = () => setTitleOverflow(el.scrollWidth > el.clientWidth)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  }, [currentTrack?.title])
  const toast = useToast()
  const liked = currentTrack && isLiked(currentTrack.videoId)

  const handleShare = () => {
    const url = currentTrack?.videoId
      ? `https://www.youtube.com/watch?v=${currentTrack.videoId}`
      : window.location.href
    if (navigator.share) {
      navigator.share({
        title: currentTrack?.title || 'VUSIC',
        text: currentTrack?.title,
        url
      }).then(() => toast('SHARED ✓')).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url).then(() => toast('COPIED TO CLIPBOARD ✓'))
    }
    setOptionsOpen(false)
  }

  const handleViewArtist = () => {
    const q = currentTrack?.channel || ''
    if (q) {
      onNavigate?.('search')
      window.dispatchEvent(new CustomEvent('vusic-search', { detail: q }))
    }
    setOptionsOpen(false)
  }

  const handleAddToQueue = () => {
    if (currentTrack) {
      addToQueue(currentTrack)
      toast('ADDED TO QUEUE ✓')
    }
    setOptionsOpen(false)
  }

  const handleSaveToLibrary = () => {
    if (currentTrack) {
      addToLibrary(currentTrack)
      toast('ADDED TO LIBRARY ✓')
    }
    setOptionsOpen(false)
  }

  const setSleepTimer = (mins) => {
    setSleepTimerSeconds(mins > 0 ? mins * 60 : 0)
    setSleepPickerOpen(false)
    setOptionsOpen(false)
  }

  const onTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) playPrevious()
      else playNext()
    } else if (dy > 80) {
      onNavigate?.('home')
    }
  }

  if (!currentTrack) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <p>No track playing</p>
          <p className={styles.hint}>Search and tap a track to start</p>
        </div>
      </div>
    )
  }

  const safeDuration = Number.isFinite(duration) && !Number.isNaN(duration) && duration > 0 ? duration : 0
  const safeCurrentTime = Number.isFinite(currentTime) && !Number.isNaN(currentTime) ? Math.max(0, currentTime) : 0
  const remaining = safeDuration > 0 ? safeDuration - safeCurrentTime : 0
  const b = bands || { bass: 0, mid: 0, treble: 0 }
  const eqBarHeights = [
    20 + (b.bass * 1.2),
    24 + (b.bass * 1.5),
    20 + (b.mid * 1.5),
    16 + (b.mid * 0.8 + b.treble * 0.5),
    20 + (b.treble * 1.5)
  ].map((h) => Math.max(4, Math.min(24, h)))

  return (
    <div
      className={styles.page}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {(preparingTrack || buffering) && !streamError && <div className={styles.bufferingBar} />}

      {welcomeBack && (
        <div className={styles.welcomeBack}>
          WELCOME BACK · TAP TO RESUME
        </div>
      )}

      {loadTimeout && (
        <div className={styles.loadTimeout}>
          <span>TAKING TOO LONG — TAP TO RETRY</span>
          <button type="button" onClick={() => { setLoadTimeout(false); playTrack(currentTrack, queue, queueIndex, true) }}>
            RETRY
          </button>
        </div>
      )}

      {sleepTimerSeconds > 0 && (
        <div className={styles.sleepPill}>
          SLEEP IN {formatSleepTime(sleepTimerSeconds)}
        </div>
      )}

      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => onNavigate?.('home')} aria-label="Back">
          <ChevronLeft size={24} />
        </button>
        <span className={styles.topBarLabel}>NOW PLAYING</span>
        <button type="button" className={styles.optionsBtn} onClick={() => setOptionsOpen(true)} aria-label="Options">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className={styles.thumbWrap}>
        <img src={currentTrack.thumbnail} alt="" className={styles.thumb} />
        <div className={styles.scanline} aria-hidden="true" />
      </div>

      {preparingTrack && !streamError && (
        <p className={styles.preparingText}>PREPARING TRACK...</p>
      )}

      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h1 ref={titleRef} className={`${styles.title} ${titleOverflow ? styles.overflow : ''}`}>
            {currentTrack.title}
          </h1>
        </div>
        <p className={styles.channel}>{currentTrack.channel?.toUpperCase() || 'UNKNOWN'}</p>
        <button
          type="button"
          className={`${styles.likeBtn} ${liked ? styles.liked : ''}`}
          onClick={() => toggleLike(currentTrack)}
        >
          <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className={styles.eqViz} aria-hidden="true">
        {eqBarHeights.map((h, i) => (
          <div key={i} className={styles.eqVizBar} style={{ height: `${h}px` }} />
        ))}
      </div>

      {streamError && queue.length === 0 && (
        <div className={styles.error}>
          <span>STREAM FAILED</span>
          <button type="button" onClick={() => { setStreamError(false); setLoadTimeout(false); playTrack(currentTrack, queue, queueIndex, true) }}>
            RETRY
          </button>
        </div>
      )}


      <div className={styles.progressSection}>
        <ProgressBar value={safeCurrentTime} max={safeDuration} onSeek={seekTo} disabled={safeDuration <= 0} />
        <div className={styles.timeRow}>
          <span className={styles.time}>-{formatTime(remaining)}</span>
          <span className={styles.time}>{formatTime(safeDuration)}</span>
        </div>
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.ctrlBtn} onClick={playPrevious} aria-label="Previous">
          <SkipBack size={24} />
        </button>
        <button type="button" className={styles.ctrlBtn} onClick={() => seek(-10)} aria-label="Seek -10s">
          <RotateCcw size={20} />
        </button>
        <button
          type="button"
          className={`${styles.ctrlBtn} ${styles.playBtn}`}
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {preparingTrack && !isPlaying ? (
            <Loader2 size={32} className={styles.spinner} />
          ) : isPlaying ? (
            <Pause size={32} />
          ) : (
            <Play size={32} />
          )}
        </button>
        <button type="button" className={styles.ctrlBtn} onClick={() => seek(10)} aria-label="Seek +10s">
          <RotateCw size={20} />
        </button>
        <button type="button" className={styles.ctrlBtn} onClick={playNext} aria-label="Next">
          <SkipForward size={24} />
        </button>
      </div>

      <div className={styles.volumeSection}>
        <ProgressBar value={volume} max={1} onSeek={(v) => setVolume(v)} disabled={false} />
      </div>

      <div className={styles.extraControls}>
        <button
          type="button"
          className={`${styles.extraBtn} ${loop ? styles.active : ''}`}
          onClick={() => setLoop(!loop)}
          title="Loop"
          aria-label="Loop"
        >
          <RotateCcw size={18} />
        </button>
        <button
          type="button"
          className={`${styles.extraBtn} ${shuffle ? styles.active : ''}`}
          onClick={() => setShuffle(!shuffle)}
          title="Shuffle"
          aria-label="Shuffle"
        >
          <SkipForward size={18} />
        </button>
        <button
          type="button"
          className={styles.extraBtn}
          onClick={() => { currentTrack && addToLibrary(currentTrack); toast('ADDED TO LIBRARY ✓') }}
          title="Add to Library"
          aria-label="Add to Library"
        >
          <Library size={18} />
        </button>
        <button
          type="button"
          className={styles.extraBtn}
          onClick={() => setQueueOpen(true)}
          title="Queue"
          aria-label="Queue"
        >
          <List size={18} />
        </button>
      </div>

      {optionsOpen && (
        <NowPlayingOptionsSheet
          onClose={() => setOptionsOpen(false)}
          onAddToQueue={handleAddToQueue}
          onSaveToLibrary={handleSaveToLibrary}
          onAddToPlaylist={() => { setOptionsOpen(false); setPlaylistPickerOpen(true) }}
          onShare={handleShare}
          onViewArtist={handleViewArtist}
          onSleepTimer={() => setSleepPickerOpen(true)}
          sleepPickerOpen={sleepPickerOpen}
          setSleepTimer={setSleepTimer}
          onCloseSleepPicker={() => setSleepPickerOpen(false)}
        />
      )}

      {playlistPickerOpen && currentTrack && (
        <PlaylistPickerModal track={currentTrack} onClose={() => setPlaylistPickerOpen(false)} />
      )}

      {queueOpen && (
        <QueueSheet
          queue={queue}
          queueIndex={queueIndex}
          currentTrack={currentTrack}
          onClose={() => setQueueOpen(false)}
          onSelectTrack={(idx) => {
            jumpToQueueIndex(idx)
            setQueueOpen(false)
          }}
          isPlaying={isPlaying}
        />
      )}

      {historyOpen && (
        <HistorySheet
          history={recentHistory}
          currentTrack={currentTrack}
          onClose={() => setHistoryOpen(false)}
          onSelectTrack={(track, index) => {
            playTrack(track, recentHistory, index, true)
            setHistoryOpen(false)
          }}
          isPlaying={isPlaying}
        />
      )}
    </div>
  )
}

function NowPlayingOptionsSheet({
  onClose,
  onAddToQueue,
  onSaveToLibrary,
  onAddToPlaylist,
  onShare,
  onViewArtist,
  onSleepTimer,
  sleepPickerOpen,
  setSleepTimer,
  onCloseSleepPicker
}) {
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <button type="button" onClick={onAddToQueue}>Add to Queue</button>
        <button type="button" onClick={onSaveToLibrary}>Save to Library</button>
        <button type="button" onClick={onAddToPlaylist}>Add to Playlist</button>
        <button type="button" onClick={onShare}>Share</button>
        <button type="button" onClick={onViewArtist}>View Artist</button>
        <button type="button" onClick={onSleepTimer}>Sleep Timer</button>
        {sleepPickerOpen && (
          <div className={styles.sleepPicker}>
            {[15, 30, 45, 60].map((m) => (
              <button key={m} type="button" onClick={() => setSleepTimer(m)}>
                {m} min
              </button>
            ))}
            <button type="button" onClick={() => setSleepTimer(0)}>Off</button>
            <button type="button" onClick={onCloseSleepPicker}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

function QueueSheet({ queue, queueIndex, currentTrack, onClose, onSelectTrack, isPlaying }) {
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.queueSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <h3 className={styles.queueTitle}>QUEUE</h3>
        <div className={styles.queueList}>
          {queue.map((t, i) => (
            <button
              key={t.videoId}
              type="button"
              className={`${styles.queueItem} ${i === queueIndex ? styles.queueActive : ''}`}
              onClick={() => onSelectTrack(i)}
            >
              {i === queueIndex && isPlaying && <Equalizer />}
              <img src={t.thumbnail} alt="" />
              <div className={styles.queueInfo}>
                <span>{t.title}</span>
                <span className={styles.queueChannel}>{t.channel}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function HistorySheet({ history, currentTrack, onClose, onSelectTrack, isPlaying }) {
  const list = Array.isArray(history) ? history : []
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <div className={styles.queueSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <h3 className={styles.queueTitle}>HISTORY</h3>
        <div className={styles.queueList}>
          {list.map((t, i) => (
            <button
              key={`${t.videoId}-${i}`}
              type="button"
              className={`${styles.queueItem} ${currentTrack?.videoId === t.videoId ? styles.queueActive : ''}`}
              onClick={() => onSelectTrack(t, i)}
            >
              {currentTrack?.videoId === t.videoId && isPlaying && <Equalizer />}
              <img src={t.thumbnail} alt="" />
              <div className={styles.queueInfo}>
                <span>{t.title}</span>
                <span className={styles.queueChannel}>{t.channel}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
