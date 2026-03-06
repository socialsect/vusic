import { useState } from 'react'
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
      <MiniPlayer onNavigate={setActivePage} />
      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <PlayerProvider>
          <LikesProvider>
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
