import { Search, Home, Disc3, Library, Settings } from 'lucide-react'
import styles from '../styles/BottomNav.module.css'

const NAV_ITEMS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'nowplaying', label: 'Now Playing', icon: Disc3 },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export function BottomNav({ active, onNavigate }) {
  return (
    <nav className={styles.nav} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        const isNowPlaying = id === 'nowplaying'
        return (
          <button
            key={id}
            type="button"
            className={`${styles.item} ${isActive ? styles.active : ''} ${isNowPlaying ? styles.nowplaying : ''}`}
            onClick={() => onNavigate(id)}
          >
            <Icon size={isNowPlaying ? 26 : 22} strokeWidth={2} />
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
