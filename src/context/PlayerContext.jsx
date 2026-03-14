import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import { useToast } from './ToastContext'
import { useEqualizer } from '../hooks/useEqualizer'

const BASE_URL = 'https://vusic-backend-production.up.railway.app'
const HISTORY_KEY = 'vusic_history'
const SETTINGS_KEY = 'vusic_settings'
const CURRENT_TRACK_KEY = 'vusic_current_track'
const CURRENT_TIME_KEY = 'vusic_current_time'
const QUEUE_KEY = 'vusic_queue'

function getQuality() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return s.quality || 'medium'
  } catch {
    return 'medium'
  }
}

export function getStreamUrl(videoId) {
  const q = getQuality()
  return `${BASE_URL}/api/stream/${videoId}?quality=${q}`
}

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const toast = useToast()
  const audioRef = useRef(null)
  const { bands, setBand, initEQ, applyBands } = useEqualizer(audioRef)
  const preloadRef = useRef(null)
  const saveTimeIntervalRef = useRef(null)
  const loadTimeoutTimerRef = useRef(null)
  const errorRetryCountRef = useRef(0)
  const shouldPlayRef = useRef(false)
  const prefetchedRef = useRef(new Set())
  const skipToNextRef = useRef(null)
  const skipToPrevRef = useRef(null)

  const [currentTrack, setCurrentTrackState] = useState(() => {
    try {
      const raw = localStorage.getItem(CURRENT_TRACK_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [queue, setQueue] = useState(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => {
    try {
      const t = localStorage.getItem(CURRENT_TIME_KEY)
      return t != null ? parseFloat(t) : 0
    } catch {
      return 0
    }
  })
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(() => {
    try {
      const v = localStorage.getItem('vusic_volume')
      return v != null ? parseFloat(v) : 0.8
    } catch {
      return 0.8
    }
  })
  const [loop, setLoop] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [streamError, setStreamError] = useState(false)
  const [preparingTrack, setPreparingTrack] = useState(false)
  const [loadTimeout, setLoadTimeout] = useState(false)
  const [welcomeBack, setWelcomeBack] = useState(false)
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState(0)
  const [recentHistory, setRecentHistory] = useState(() => {
    try {
      let raw = localStorage.getItem(HISTORY_KEY)
      if (!raw) raw = localStorage.getItem('vusic_recently_played')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const addToHistory = useCallback((track) => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY)
      const list = raw ? JSON.parse(raw) : []
      const filtered = list.filter((t) => t.videoId !== track.videoId)
      const updated = [track, ...filtered].slice(0, 50)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
      setRecentHistory(updated)
    } catch (e) {
      console.error('addToHistory error:', e)
    }
  }, [])

  const addToQueue = useCallback((track) => {
    setQueue((prev) => [...prev, track])
  }, [])

  const preloadNextTrack = useCallback(() => {
    const nextIdx = queueIndex + 1
    if (nextIdx >= queue.length) return
    const next = queue[nextIdx]
    if (!next?.videoId) return
    const src = getStreamUrl(next.videoId)
    if (!preloadRef.current) {
      preloadRef.current = new Audio()
      preloadRef.current.preload = 'auto'
    }
    preloadRef.current.src = src
    preloadRef.current.load()
  }, [queue, queueIndex])

  const playTrack = useCallback(
    (track, newQueue = null, index = 0, fromUserGesture = false) => {
      if (!track?.videoId) return
      if (fromUserGesture) {
        initEQ()
        applyBands()
      }
      setCurrentTrackState(track)
      setStreamError(false)
      setLoadTimeout(false)
      setCurrentTime(0)
      setDuration(0)
      errorRetryCountRef.current = 0
      if (Array.isArray(newQueue)) {
        prefetchedRef.current = new Set()
        setQueue(newQueue)
        setQueueIndex(index >= 0 && index < newQueue.length ? index : 0)
      }
      addToHistory(track)
      setPreparingTrack(true)
      setWelcomeBack(false)
      if (loadTimeoutTimerRef.current) clearTimeout(loadTimeoutTimerRef.current)
      loadTimeoutTimerRef.current = setTimeout(() => setLoadTimeout(true), 30000)

      const src = getStreamUrl(track.videoId)
      if (audioRef.current) {
        setDuration(0)
        setCurrentTime(0)
        shouldPlayRef.current = fromUserGesture || isPlaying
        const audio = audioRef.current
        audio.pause()
        audio.src = ''
        audio.load()
        audio.src = src
        audio.load()
      }
    },
    [addToHistory, isPlaying]
  )

  const playTrackWithPlayingState = useCallback(
    (track, newQueue, index, wasPlaying, fromUserGesture = false) => {
      if (!track?.videoId) return
      if (fromUserGesture) {
        initEQ()
        applyBands()
      }
      setCurrentTrackState(track)
      setStreamError(false)
      setLoadTimeout(false)
      setCurrentTime(0)
      setDuration(0)
      errorRetryCountRef.current = 0
      if (Array.isArray(newQueue)) {
        prefetchedRef.current = new Set()
        setQueue(newQueue)
        setQueueIndex(index >= 0 && index < newQueue.length ? index : 0)
      }
      addToHistory(track)
      setPreparingTrack(true)
      if (loadTimeoutTimerRef.current) clearTimeout(loadTimeoutTimerRef.current)
      loadTimeoutTimerRef.current = setTimeout(() => setLoadTimeout(true), 30000)

      const src = getStreamUrl(track.videoId)
      if (audioRef.current) {
        setDuration(0)
        setCurrentTime(0)
        shouldPlayRef.current = !!wasPlaying
        const audio = audioRef.current
        audio.pause()
        audio.src = ''
        audio.load()
        audio.src = src
        audio.load()
      }
    },
    [addToHistory]
  )

  const jumpToQueueIndex = useCallback((idx) => {
    const track = queue[idx]
    if (track) playTrackWithPlayingState(track, queue, idx, isPlaying, true)
  }, [queue, playTrackWithPlayingState, isPlaying])

  const playAudioDirect = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().catch(() => {})
    }
  }, [currentTrack])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    if (currentTrack) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        initEQ()
        applyBands()
        audioRef.current.play().catch(() => {})
      }
    }
  }, [currentTrack, isPlaying, initEQ, applyBands])

  const seek = useCallback((seconds) => {
    if (!audioRef.current) return
    const next = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration || 0))
    audioRef.current.currentTime = next
    setCurrentTime(next)
  }, [duration])

  const seekTo = useCallback((time) => {
    if (!audioRef.current) return
    const t = Math.max(0, Math.min(time, duration || 0))
    audioRef.current.currentTime = t
    setCurrentTime(t)
  }, [duration])

  const setVolume = useCallback((v) => {
    const val = Math.max(0, Math.min(1, v))
    setVolumeState(val)
    if (audioRef.current) audioRef.current.volume = val
    try {
      localStorage.setItem('vusic_volume', String(val))
    } catch {}
  }, [])

  const fetchRecommendations = useCallback(async (artistName, options = {}) => {
    const { appendToQueue = true, showToasts = true } = options
    try {
      if (showToasts) toast('FINDING SIMILAR SONGS...')
      const res = await fetch(`${BASE_URL}/api/recommendations/${encodeURIComponent(artistName)}`)
      const { queries, similarArtists } = await res.json()

      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      const historyIds = new Set(history.map((t) => t.videoId))
      const allTracks = []

      for (const query of (queries || []).slice(0, 4)) {
        try {
          const r = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(query)}`)
          const data = await r.json()
          const fresh = (data.items || []).filter((t) => !historyIds.has(t.videoId)).slice(0, 3)
          allTracks.push(...fresh)
        } catch (e) {
          // ignore
        }
      }

      const seen = new Set()
      const unique = allTracks.filter((t) => {
        if (seen.has(t.videoId)) return false
        seen.add(t.videoId)
        return true
      })

      if (unique.length > 0) {
        if (appendToQueue) {
          setQueue((prev) => [...prev, ...unique])
          if (showToasts) toast(`ADDED ${unique.length} SIMILAR SONGS`)
        }
        if (similarArtists?.length > 0) {
          console.log('[rec] similar artists:', similarArtists.join(', '))
        }
      }
      return unique
    } catch (err) {
      console.error('Recommendations error:', err)
      return []
    }
  }, [toast])

  const playNext = useCallback(() => {
    if (queue.length === 0) return false
    const atEnd = queueIndex >= queue.length - 1
    if (!loop && !shuffle && atEnd) {
      const artist = currentTrack?.channel
      if (!artist) return false
      fetchRecommendations(artist).then((newTracks) => {
        if (newTracks.length > 0) {
          const newQueue = [...queue, ...newTracks]
          playTrackWithPlayingState(newTracks[0], newQueue, queue.length, true)
        }
      })
      return true
    }
    let nextIndex
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = loop ? queueIndex : Math.min(queueIndex + 1, queue.length - 1)
      if (!loop && nextIndex === queueIndex && queueIndex < queue.length - 1) nextIndex = queueIndex + 1
    }
    const nextTrack = queue[nextIndex]
    if (nextTrack) playTrackWithPlayingState(nextTrack, queue, nextIndex, true, true)
    return !!nextTrack
  }, [queue, queueIndex, loop, shuffle, currentTrack, playTrackWithPlayingState, toast, fetchRecommendations])

  const playPrevious = useCallback(() => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      return
    }
    if (queue.length === 0) return
    const prevIndex = Math.max(0, queueIndex - 1)
    const prevTrack = queue[prevIndex]
    if (prevTrack) playTrackWithPlayingState(prevTrack, queue, prevIndex, true, true)
  }, [queue, queueIndex, currentTime, playTrackWithPlayingState])

  useEffect(() => {
    skipToNextRef.current = playNext
    skipToPrevRef.current = playPrevious
  }, [playNext, playPrevious])

  function registerMediaSession(track, audioEl) {
    if (!('mediaSession' in navigator)) return
    if (!track || !audioEl) return

    const thumb = track.thumbnail || ''
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Unknown',
      artist: track.channel || 'Vusic',
      album: 'Vusic',
      artwork: thumb
        ? [
            { src: thumb, sizes: '96x96' },
            { src: thumb, sizes: '128x128' },
            { src: thumb, sizes: '192x192' },
            { src: thumb, sizes: '256x256' },
            { src: thumb, sizes: '384x384' },
            { src: thumb, sizes: '512x512' },
          ]
        : []
    })

    navigator.mediaSession.setActionHandler('play', () => {
      audioEl.play().catch(() => {})
      navigator.mediaSession.playbackState = 'playing'
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      audioEl.pause()
      navigator.mediaSession.playbackState = 'paused'
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      skipToNextRef.current?.()
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      skipToPrevRef.current?.()
    })

    navigator.mediaSession.setActionHandler('seekbackward', (d) => {
      audioEl.currentTime = Math.max(0, audioEl.currentTime - (d?.seekOffset || 10))
    })

    navigator.mediaSession.setActionHandler('seekforward', (d) => {
      audioEl.currentTime = Math.min(
        isFinite(audioEl.duration) ? audioEl.duration : 0,
        audioEl.currentTime + (d?.seekOffset || 10)
      )
    })

    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d?.seekTime !== undefined && isFinite(d.seekTime)) {
        audioEl.currentTime = d.seekTime
      }
    })
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      registerMediaSession(currentTrack, audioRef.current)
    }
  }, [currentTrack])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    if (currentTrack && audioRef.current) {
      registerMediaSession(currentTrack, audioRef.current)
    }
  }, [isPlaying, currentTrack])

  useEffect(() => {
    if (currentTrack) {
      try {
        localStorage.setItem(CURRENT_TRACK_KEY, JSON.stringify(currentTrack))
      } catch (_) {}
    }
  }, [currentTrack])

  useEffect(() => {
    saveTimeIntervalRef.current = setInterval(() => {
      if (audioRef.current && currentTrack) {
        const t = audioRef.current.currentTime
        setCurrentTime(t)
        try {
          localStorage.setItem(CURRENT_TIME_KEY, String(t))
          localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
          localStorage.setItem('vusic_was_playing', isPlaying ? '1' : '0')
        } catch (_) {}
      }
    }, 5000)
    return () => clearInterval(saveTimeIntervalRef.current)
  }, [currentTrack, queue, isPlaying])

  useEffect(() => {
    preloadNextTrack()
  }, [currentTrack, queue, queueIndex, preloadNextTrack])

  useEffect(() => {
    const remaining = queue.length - queueIndex - 1
    if (remaining > 2 || !currentTrack?.channel) return
    fetchRecommendations(currentTrack.channel).catch(() => {})
  }, [queueIndex, queue.length, currentTrack?.channel, fetchRecommendations])

  useEffect(() => {
    if (sleepTimerSeconds <= 0) return
    const id = setInterval(() => {
      setSleepTimerSeconds((s) => {
        if (s <= 1) {
          if (audioRef.current) audioRef.current.pause()
          setIsPlaying(false)
          toast('SLEEP TIMER ENDED')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [sleepTimerSeconds, toast])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && !Number.isNaN(audio.duration)) {
        setDuration(audio.duration)
      }
    }
    const onTimeUpdate = () => {
      if (Number.isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime)
      }
      if ('mediaSession' in navigator && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Number.isFinite(audio.currentTime) ? audio.currentTime : 0
          })
        } catch (_) {}
      }
      const currentQuality = getQuality()
      if (audio.currentTime > 15 && queue.length > 0 && queueIndex < queue.length - 1) {
        const nextTrack = queue[queueIndex + 1]
        if (nextTrack && !prefetchedRef.current.has(nextTrack.videoId)) {
          prefetchedRef.current.add(nextTrack.videoId)
          console.log(`[prefetch] triggered for: ${nextTrack.title} at ${Math.floor(audio.currentTime)}s`)
          fetch(`${BASE_URL}/api/prefetch/${nextTrack.videoId}?quality=${currentQuality}`).catch(() => {})
        }
      }
      if (audio.currentTime > 60 && queue.length > 0 && queueIndex < queue.length - 2) {
        const twoAhead = queue[queueIndex + 2]
        if (twoAhead && !prefetchedRef.current.has(twoAhead.videoId)) {
          prefetchedRef.current.add(twoAhead.videoId)
          console.log(`[prefetch] triggered for: ${twoAhead.title} at ${Math.floor(audio.currentTime)}s`)
          fetch(`${BASE_URL}/api/prefetch/${twoAhead.videoId}?quality=${currentQuality}`).catch(() => {})
        }
      }
    }
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration) && !Number.isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration)
      }
    }
    const handleTrackEndOrNext = () => {
      if (queueIndex + 1 < queue.length) {
        const next = queue[queueIndex + 1]
        playTrackWithPlayingState(next, queue, queueIndex + 1, true)
        return
      }
      const artist = currentTrack?.channel
      if (!artist) return
      fetchRecommendations(artist).then((newTracks) => {
        if (newTracks.length > 0) {
          const newQueue = [...queue, ...newTracks]
          playTrackWithPlayingState(newTracks[0], newQueue, queue.length, true)
        }
      })
    }

    const onEnded = () => {
      setBuffering(false)
      setPreparingTrack(false)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
      setIsPlaying(false)
      if (loop && currentTrack) {
        audio.currentTime = 0
        audio.play()
      } else {
        handleTrackEndOrNext()
      }
    }
    const onCanPlay = () => {
      if (loadTimeoutTimerRef.current) clearTimeout(loadTimeoutTimerRef.current)
      loadTimeoutTimerRef.current = null
      setBuffering(false)
      setPreparingTrack(false)
      setLoadTimeout(false)
      if (shouldPlayRef.current) {
        audio.play().catch((err) => {
          console.warn('Play failed:', err)
          setStreamError(true)
          setPreparingTrack(false)
        })
      }
    }
    const onPlaying = () => {
      setIsPlaying(true)
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
        registerMediaSession(currentTrack, audio)
      }
    }
    const onPause = () => {
      setIsPlaying(false)
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused'
    }
    const onWaiting = () => setBuffering(true)
    const onError = () => {
      setBuffering(false)
      if (loadTimeoutTimerRef.current) clearTimeout(loadTimeoutTimerRef.current)
      loadTimeoutTimerRef.current = null
      setLoadTimeout(false)
      const code = audio.error?.code
      if (errorRetryCountRef.current < 1 && (code === 2 || code === 4)) {
        errorRetryCountRef.current += 1
        setTimeout(() => {
          audio.load()
          audio.play().catch(() => {
            const hasNext = queue.length > 0 && (shuffle || queueIndex < queue.length - 1 || loop)
            if (hasNext) {
              toast('TRACK UNAVAILABLE — SKIPPING')
              const didSkip = playNext()
              if (didSkip) setStreamError(false)
              else setStreamError(true)
            } else {
              setStreamError(true)
            }
            setPreparingTrack(false)
          })
        }, 1000)
      } else {
        const hasNext = queue.length > 0 && (shuffle || queueIndex < queue.length - 1 || loop)
        if (hasNext) {
          toast('TRACK UNAVAILABLE — SKIPPING')
          const didSkip = playNext()
          if (didSkip) setStreamError(false)
          else setStreamError(true)
        } else {
          setStreamError(true)
        }
        setPreparingTrack(false)
      }
    }

    if ('mediaSession' in navigator) registerMediaSession(currentTrack, audio)

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('error', onError)
    }
  }, [currentTrack, loop, shuffle, queue, queueIndex, playTrackWithPlayingState, playNext, playPrevious, toast, fetchRecommendations])

  useEffect(() => {
    async function warmCache() {
      try {
        const liked = JSON.parse(localStorage.getItem('vusic_library') || '[]')
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
        const seen = new Set()
        const toCache = []
        for (const track of [...liked, ...history]) {
          if (track.videoId && !seen.has(track.videoId)) {
            seen.add(track.videoId)
            toCache.push(track)
          }
        }
        const toWarm = toCache.slice(0, 10)
        console.log(`[warmCache] pre-caching ${toWarm.length} tracks`)
        const currentQuality = getQuality()
        for (let i = 0; i < toWarm.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
          const track = toWarm[i]
          fetch(`${BASE_URL}/api/prefetch/${track.videoId}?quality=${currentQuality}`)
            .then(() => console.log(`[warmCache] cached: ${track.title}`))
            .catch(() => {})
        }
      } catch (err) {
        console.error('[warmCache] error:', err)
      }
    }
    const timer = setTimeout(() => {
      warmCache()
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let mounted = true
    const run = () => {
      const audio = audioRef.current
      if (!audio || !mounted) return
      try {
        const raw = localStorage.getItem(CURRENT_TRACK_KEY)
        const savedTrack = raw ? JSON.parse(raw) : null
        const savedTimeRaw = localStorage.getItem(CURRENT_TIME_KEY)
        const savedTime = savedTimeRaw != null ? parseFloat(savedTimeRaw) : 0
        if (savedTrack?.videoId) {
          setIsPlaying(false)
          const src = getStreamUrl(savedTrack.videoId)
          audio.src = src
          audio.load()
          const applyTime = () => {
            if (mounted && audioRef.current && !isNaN(audioRef.current.duration)) {
              audioRef.current.currentTime = savedTime
              setCurrentTime(savedTime)
            }
          }
          audio.addEventListener('loadedmetadata', applyTime, { once: true })
          setWelcomeBack(true)
          setTimeout(() => mounted && setWelcomeBack(false), 4000)
        }
      } catch (_) {}
    }
    const t = setTimeout(run, 100)
    return () => { mounted = false; clearTimeout(t) }
  }, [])

  const clearHistory = useCallback(() => {
    localStorage.setItem(HISTORY_KEY, '[]')
    setRecentHistory([])
  }, [])

  const value = {
    audioRef,
    BASE_URL,
    recentHistory,
    clearHistory,
    currentTrack,
    queue,
    queueIndex,
    setQueue,
    setQueueIndex,
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
    setLoadTimeout,
    welcomeBack,
    setWelcomeBack,
    setCurrentTrack: setCurrentTrackState,
    playTrack,
    playTrackWithPlayingState,
    togglePlayPause,
    playAudioDirect,
    seek,
    seekTo,
    setVolume,
    setLoop,
    setShuffle,
    setIsPlaying,
    setStreamError,
    playNext,
    playPrevious,
    addToQueue,
    jumpToQueueIndex,
    sleepTimerSeconds,
    setSleepTimerSeconds,
    bands,
    setBand,
    fetchRecommendations
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
