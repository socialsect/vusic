import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import { useToast } from './ToastContext'

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
  const preloadRef = useRef(null)
  const saveTimeIntervalRef = useRef(null)
  const loadTimeoutTimerRef = useRef(null)
  const errorRetryCountRef = useRef(0)

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
      setCurrentTrackState(track)
      setStreamError(false)
      setLoadTimeout(false)
      setCurrentTime(0)
      setDuration(0)
      errorRetryCountRef.current = 0
      if (Array.isArray(newQueue)) {
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
        audioRef.current.preload = 'auto'
        audioRef.current.src = src
        audioRef.current.load()
        const shouldPlay = fromUserGesture || isPlaying
        setIsPlaying(!!shouldPlay)
        if (shouldPlay) {
          audioRef.current.play().catch((e) => {
            console.error('play error:', e)
            setStreamError(true)
            setBuffering(false)
            setPreparingTrack(false)
          })
        }
      }
    },
    [addToHistory, isPlaying]
  )

  const playTrackWithPlayingState = useCallback(
    (track, newQueue, index, wasPlaying) => {
      if (!track?.videoId) return
      setCurrentTrackState(track)
      setStreamError(false)
      setLoadTimeout(false)
      setCurrentTime(0)
      setDuration(0)
      errorRetryCountRef.current = 0
      if (Array.isArray(newQueue)) {
        setQueue(newQueue)
        setQueueIndex(index >= 0 && index < newQueue.length ? index : 0)
      }
      addToHistory(track)
      setPreparingTrack(true)
      setIsPlaying(!!wasPlaying)
      if (loadTimeoutTimerRef.current) clearTimeout(loadTimeoutTimerRef.current)
      loadTimeoutTimerRef.current = setTimeout(() => setLoadTimeout(true), 30000)

      const src = getStreamUrl(track.videoId)
      if (audioRef.current) {
        audioRef.current.preload = 'auto'
        audioRef.current.src = src
        audioRef.current.load()
        if (wasPlaying) {
          audioRef.current.play().catch((e) => {
            setStreamError(true)
            setBuffering(false)
            setPreparingTrack(false)
          })
        }
      }
    },
    [addToHistory]
  )

  const jumpToQueueIndex = useCallback((idx) => {
    const track = queue[idx]
    if (track) playTrackWithPlayingState(track, queue, idx, isPlaying)
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
        audioRef.current.play().catch(() => {})
      }
      setIsPlaying(!isPlaying)
    }
  }, [currentTrack, isPlaying])

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

  const playNext = useCallback(() => {
    if (queue.length === 0) return
    let nextIndex
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = loop ? queueIndex : Math.min(queueIndex + 1, queue.length - 1)
      if (!loop && nextIndex === queueIndex && queueIndex < queue.length - 1) nextIndex = queueIndex + 1
    }
    const nextTrack = queue[nextIndex]
    if (nextTrack) playTrackWithPlayingState(nextTrack, queue, nextIndex, true)
    return !!nextTrack
  }, [queue, queueIndex, loop, shuffle, playTrackWithPlayingState])

  const playPrevious = useCallback(() => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      return
    }
    if (queue.length === 0) return
    const prevIndex = Math.max(0, queueIndex - 1)
    const prevTrack = queue[prevIndex]
    if (prevTrack) playTrackWithPlayingState(prevTrack, queue, prevIndex, true)
  }, [queue, queueIndex, currentTime, playTrackWithPlayingState])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

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

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(audio.duration)
    const onEnded = () => {
      setBuffering(false)
      setPreparingTrack(false)
      if (loop && currentTrack) {
        audio.currentTime = 0
        audio.play()
      } else if (queue.length > 0) {
        const nextIdx = shuffle
          ? Math.floor(Math.random() * queue.length)
          : queueIndex >= queue.length - 1
            ? 0
            : queueIndex + 1
        const next = queue[nextIdx]
        if (next) playTrackWithPlayingState(next, queue, nextIdx, true)
      } else {
        setIsPlaying(false)
      }
    }
    const onCanPlay = () => {
      if (loadTimeoutTimerRef.current) clearTimeout(loadTimeoutTimerRef.current)
      loadTimeoutTimerRef.current = null
      setBuffering(false)
      setPreparingTrack(false)
      setLoadTimeout(false)
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

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('error', onError)
    }
  }, [currentTrack, loop, shuffle, queue, queueIndex, playTrackWithPlayingState, playNext, toast])

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
    setSleepTimerSeconds
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
