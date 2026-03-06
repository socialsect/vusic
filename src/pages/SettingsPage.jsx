import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useTheme } from '../context/ThemeContext'
import { SpeedTest } from '../components/SpeedTest'
import styles from '../styles/SettingsPage.module.css'

const HISTORY_KEY = 'vusic_history'
const LIBRARY_KEY = 'vusic_library'
const SETTINGS_KEY = 'vusic_settings'

const QUALITY_OPTS = [
  { id: 'low', label: 'LOW', kbps: '64kbps' },
  { id: 'medium', label: 'MEDIUM', kbps: '128kbps' },
  { id: 'high', label: 'HIGH', kbps: '256kbps' }
]

const FONT_OPTS = [
  { id: 'small', size: 14 },
  { id: 'medium', size: 16 },
  { id: 'large', size: 18 }
]

const THEME_SWATCHS = [
  { id: 'MATRIX', color: '#c8f135' },
  { id: 'NEON BLUE', color: '#00b4ff' },
  { id: 'SYNTHWAVE', color: '#ff2d9b' },
  { id: 'INFERNO', color: '#ff6b2b' },
  { id: 'ARCTIC', color: '#00ffcc' },
  { id: 'MONOCHROME', color: '#ffffff' }
]

const CHANGELOG = [
  { version: 'v1.0.0', entries: ['Initial release', 'PWA support', 'Dark theme'] },
  { version: 'v0.9.0', entries: ['Beta launch', 'Search + stream'] }
]

export function SettingsPage() {
  const [, setHistory] = useLocalStorage(HISTORY_KEY, [])
  const [, setLibrary] = useLocalStorage(LIBRARY_KEY, [])
  const [settings, setSettings] = useLocalStorage(SETTINGS_KEY, {
    quality: 'medium',
    crossfade: false,
    crossfadeSeconds: 3,
    normalize: false,
    autoplay: false,
    fontSize: 'medium'
  })
  const [showClearHistory, setShowClearHistory] = useState(false)
  const [showClearLibrary, setShowClearLibrary] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const { theme, setTheme } = useTheme()

  const clearHistory = () => {
    setHistory([])
    setShowClearHistory(false)
  }

  const clearLibrary = () => {
    setLibrary([])
    setShowClearLibrary(false)
  }

  const setQuality = (q) => setSettings((s) => ({ ...s, quality: q }))
  const setFontSize = (f) => {
    setSettings((s) => ({ ...s, fontSize: f }))
    document.documentElement.style.fontSize = FONT_OPTS.find((o) => o.id === f)?.size + 'px' || '16px'
  }

  const estStorage = () => {
    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2
      }
    }
    return (total / 1024).toFixed(1) + ' KB'
  }

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>PLAYBACK</h2>
        <div className={styles.block}>
          <div className={styles.row}>
            <span className={styles.label}>AUDIO QUALITY</span>
          </div>
          <div className={styles.segmented}>
            {QUALITY_OPTS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.segBtn} ${settings.quality === o.id ? styles.segActive : ''}`}
                onClick={() => setQuality(o.id)}
              >
                {o.label} · {o.kbps}
              </button>
            ))}
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>CROSSFADE</span>
            <button
              type="button"
              className={`${styles.toggle} ${settings.crossfade ? styles.toggleOn : ''}`}
              onClick={() => setSettings((s) => ({ ...s, crossfade: !s.crossfade }))}
            >
              {settings.crossfade ? 'ON' : 'OFF'}
            </button>
          </div>
          {settings.crossfade && (
            <div className={styles.sliderRow}>
              <span>{settings.crossfadeSeconds}s</span>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.crossfadeSeconds || 3}
                onChange={(e) => setSettings((s) => ({ ...s, crossfadeSeconds: +e.target.value }))}
              />
            </div>
          )}
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>NORMALIZE VOLUME</span>
            <button
              type="button"
              className={`${styles.toggle} ${settings.normalize ? styles.toggleOn : ''}`}
              onClick={() => setSettings((s) => ({ ...s, normalize: !s.normalize }))}
            >
              {settings.normalize ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>AUTOPLAY</span>
            <button
              type="button"
              className={`${styles.toggle} ${settings.autoplay ? styles.toggleOn : ''}`}
              onClick={() => setSettings((s) => ({ ...s, autoplay: !s.autoplay }))}
            >
              {settings.autoplay ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>APPEARANCE</h2>
        <div className={styles.block}>
          <div className={styles.row}>
            <span className={styles.label}>THEME</span>
          </div>
          <div className={styles.swatches}>
            {THEME_SWATCHS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.swatch} ${theme === t.id ? styles.swatchActive : ''}`}
                style={{ background: t.color }}
                onClick={() => setTheme(t.id)}
                title={t.id}
              />
            ))}
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>FONT SIZE</span>
          </div>
          <div className={styles.segmented}>
            {FONT_OPTS.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`${styles.segBtn} ${settings.fontSize === o.id ? styles.segActive : ''}`}
                onClick={() => setFontSize(o.id)}
              >
                {o.id.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>NETWORK</h2>
        <div className={styles.block}>
          <SpeedTest />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>STORAGE</h2>
        <div className={styles.block}>
          <div className={styles.row}>
            <span className={styles.label}>ESTIMATED USAGE</span>
            <span className={styles.value}>{estStorage()}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>CLEAR HISTORY</span>
            <button type="button" className={styles.action} onClick={() => setShowClearHistory(true)}>
              CLEAR
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>CLEAR LIBRARY</span>
            <button type="button" className={styles.action} onClick={() => setShowClearLibrary(true)}>
              CLEAR
            </button>
          </div>
          <div className={styles.divider} />
          <div className={styles.row}>
            <span className={styles.label}>CLEAR CACHE</span>
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                if ('caches' in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)))
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>ABOUT</h2>
        <div className={styles.block}>
          <div className={styles.row}>
            <span className={styles.label}>VERSION</span>
            <span className={styles.value}>VUSIC v1.0.0</span>
          </div>
          <p className={styles.tagline}>Built different.</p>
          <button type="button" className={styles.changelogBtn} onClick={() => setShowChangelog(true)}>
            CHANGELOG
          </button>
        </div>
      </section>

      {showClearHistory && (
        <ConfirmModal
          message="Clear recently played history?"
          onConfirm={clearHistory}
          onCancel={() => setShowClearHistory(false)}
        />
      )}
      {showClearLibrary && (
        <ConfirmModal
          message="Clear all liked/saved tracks?"
          onConfirm={clearLibrary}
          onCancel={() => setShowClearLibrary(false)}
        />
      )}
      {showChangelog && (
        <div className={styles.modalBackdrop} onClick={() => setShowChangelog(false)}>
          <div className={styles.changelogModal} onClick={(e) => e.stopPropagation()}>
            <h3>CHANGELOG</h3>
            {CHANGELOG.map((c) => (
              <div key={c.version} className={styles.changelogEntry}>
                <strong>{c.version}</strong>
                <ul>
                  {c.entries.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            ))}
            <button type="button" onClick={() => setShowChangelog(false)}>CLOSE</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div className={styles.confirmBtns}>
          <button type="button" onClick={onConfirm}>CONFIRM</button>
          <button type="button" onClick={onCancel}>CANCEL</button>
        </div>
      </div>
    </div>
  )
}
