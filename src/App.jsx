import { useState, useEffect } from 'react'
import { usePlayer } from './context/PlayerContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import { PlayerProvider } from './context/PlayerContext'
import { LikesProvider } from './context/LikesContext'
import { AudioPlayer } from './components/AudioPlayer'
import { BottomNav } from './components/BottomNav'
import { MiniPlayer } from './components/MiniPlayer'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'
import { SettingsInit } from './components/SettingsInit'
import { SearchPage } from './pages/SearchPage'
import { HomePage } from './pages/HomePage'
import { NowPlayingPage } from './pages/NowPlayingPage'
import { LibraryPage } from './pages/LibraryPage'
import { SettingsPage } from './pages/SettingsPage'
import styles from './styles/App.module.css'

const SPLASH_STATUSES = [
  'AUDIO ENGINE',
  'LOADING CACHE',
  'SYNCING QUEUE',
  'ALMOST READY',
  "LET'S GO"
]

const PAGES = {
  search: SearchPage,
  home: HomePage,
  nowplaying: NowPlayingPage,
  library: LibraryPage,
  settings: SettingsPage
}

function AppContent() {
  const [activePage, setActivePage] = useState('home')
  const { currentTrack } = usePlayer()

  const CurrentPage = PAGES[activePage]

  return (
    <div className={styles.app}>
      <SettingsInit />
      <KeyboardShortcuts currentTrack={currentTrack} />
      <main className={`${styles.main} ${currentTrack ? styles.withMini : ''}`}>
        <div className={`${styles.pageContent} ${styles.pageEnter}`}>
          <CurrentPage onNavigate={setActivePage} />
        </div>
      </main>
      <div className={styles.footer}>MADE BY VINAYAK</div>
      <MiniPlayer onNavigate={setActivePage} />
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((i) => (i < SPLASH_STATUSES.length - 1 ? i + 1 : i))
    }, 400)
    const hideTimer = setTimeout(() => setShowSplash(false), 3200)
    return () => {
      clearInterval(statusTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <ThemeProvider>
      <ToastProvider>
        <PlayerProvider>
          <LikesProvider>
            {showSplash && (
              <div className={styles.splash}>
                <div className={styles.gridBg} />
                <div className={styles.scanlines} />
                <div className={styles.glitchBar} />
                <div className={styles.glitchBar} />
                <div className={styles.glitchBar} />
                <div className={styles.particles} aria-hidden="true">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className={styles.particle} />
                  ))}
                </div>
                <div className={styles.splashCenter}>
                  <div className={styles.eqIntro} aria-hidden="true">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className={styles.eqBar} />
                    ))}
                  </div>
                  <div className={styles.logoWrap}>
                    <div className={styles.logoBorder}>
                      <div className={`${styles.corner} ${styles.cornerTl}`} />
                      <div className={`${styles.corner} ${styles.cornerTr}`} />
                      <div className={`${styles.corner} ${styles.cornerBl}`} />
                      <div className={`${styles.corner} ${styles.cornerBr}`} />
                    </div>
                    <div className={styles.logoText}>VUSIC</div>
                  </div>
                  <div className={styles.splashTagline}>MUSIC. NOTHING ELSE.</div>
                  <div className={styles.loadTrack}>
                    <div className={styles.loadFill} />
                  </div>
                  <div className={styles.status}>
                    LOADING <span className={styles.statusText}>{SPLASH_STATUSES[statusIndex]}</span>
                  </div>
                </div>
              </div>
            )}
            <AudioPlayer />
            <div className={styles.wrapper}>
              <AppContent />
            </div>
          </LikesProvider>
        </PlayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
