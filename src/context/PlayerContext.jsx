import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import { useToast } from './ToastContext'

const BASE_URL = 'https://vusic-backend-production.up.railway.app'
const HISTORY_KEY = 'vusic_history'
const SETTINGS_KEY = 'vusic_settings'

function getQuality() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return s.quality || 'medium'
  } catch {
    return 'medium'
  }
}

function getStreamUrl(videoId) {
  const q = getQuality()
  return `${BASE_URL}/api/stream/${videoId}?quality=${q}`
}

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const toast = useToast()
  const audioRef = useRef(null)
  const preloadRef = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
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
    (track, newQueue = null, index = 0) => {
      if (!track?.videoId) return
      setCurrentTrack(track)
      setStreamError(false)
      setBuffering(true)
      setCurrentTime(0)
      setDuration(0)
      if (Array.isArray(newQueue)) {
        setQueue(newQueue)
        setQueueIndex(index >= 0 && index < newQueue.length ? index : 0)
      }
      addToHistory(track)
      setIsPlaying(true)

      const src = getStreamUrl(track.videoId)
      if (audioRef.current) {
        audioRef.current.preload = 'auto'
        audioRef.current.src = src
        audioRef.current.load()
        audioRef.current.play().catch((e) => {
          console.error('play error:', e)
          setStreamError(true)
          setBuffering(false)
        })
      }
    },
    [addToHistory]
  )

  const jumpToQueueIndex = useCallback((idx) => {
    const track = queue[idx]
    if (track) playTrack(track, queue, idx)
  }, [queue, playTrack])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    if (currentTrack) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
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
    if (nextTrack) playTrack(nextTrack, queue, nextIndex)
    return !!nextTrack
  }, [queue, queueIndex, loop, shuffle, playTrack])

  const playPrevious = useCallback(() => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
      return
    }
    if (queue.length === 0) return
    const prevIndex = Math.max(0, queueIndex - 1)
    const prevTrack = queue[prevIndex]
    if (prevTrack) playTrack(prevTrack, queue, prevIndex)
  }, [queue, queueIndex, currentTime, playTrack])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

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
        if (next) playTrack(next, queue, nextIdx)
      } else {
        setIsPlaying(false)
      }
    }
    const onCanPlay = () => setBuffering(false)
    const onWaiting = () => setBuffering(true)
    const onError = () => {
      setBuffering(false)
      const hasNext = queue.length > 0 && (shuffle || queueIndex < queue.length - 1 || loop)
      if (hasNext) {
        toast('TRACK UNAVAILABLE — SKIPPING')
        const didSkip = playNext()
        if (didSkip) setStreamError(false)
        else setStreamError(true)
      } else {
        setStreamError(true)
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
  }, [currentTrack, loop, shuffle, queue, queueIndex, playTrack, playNext, toast])

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
    setCurrentTrack,
    playTrack,
    togglePlayPause,
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
