import { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const LIKED_KEY = 'vusic_library'

const LikesContext = createContext(null)

export function LikesProvider({ children }) {
  const [library, setLibrary] = useLocalStorage(LIKED_KEY, [])

  const isLiked = (videoId) => library.some((t) => t.videoId === videoId)

  const toggleLike = (track) => {
    if (!track?.videoId) return
    if (isLiked(track.videoId)) {
      setLibrary((prev) => prev.filter((t) => t.videoId !== track.videoId))
    } else {
      setLibrary((prev) => [...prev.filter((t) => t.videoId !== track.videoId), track])
    }
  }

  const addToLibrary = (track) => {
    if (!track?.videoId || isLiked(track.videoId)) return
    setLibrary((prev) => [...prev, track])
  }

  const removeFromLibrary = (videoId) => {
    setLibrary((prev) => prev.filter((t) => t.videoId !== videoId))
  }

  const value = { library, setLibrary, isLiked, toggleLike, addToLibrary, removeFromLibrary }

  return <LikesContext.Provider value={value}>{children}</LikesContext.Provider>
}

export function useLikes() {
  const ctx = useContext(LikesContext)
  if (!ctx) return { library: [], isLiked: () => false, toggleLike: () => {}, addToLibrary: () => {}, removeFromLibrary: () => {}, setLibrary: () => {} }
  return ctx
}
