import { useState } from 'react'
import styles from '../styles/SpeedTest.module.css'

const BASE_URL = 'https://vusic-backend-production.up.railway.app'
const TEST_VIDEO_ID = 'dQw4w9WgXcQ'
const TEST_DURATION_MS = 5000

export function SpeedTest() {
  const [status, setStatus] = useState('idle')
  const [downloadMbps, setDownloadMbps] = useState(null)
  const [error, setError] = useState(null)

  const runTest = async () => {
    setStatus('running')
    setDownloadMbps(null)
    setError(null)

    const startTime = Date.now()
    let totalBytes = 0

    try {
      const res = await fetch(`${BASE_URL}/api/stream/${TEST_VIDEO_ID}?quality=low`)
      if (!res.ok) throw new Error('Stream failed')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      while (Date.now() - startTime < TEST_DURATION_MS) {
        const { done, value } = await reader.read()
        if (done) break
        totalBytes += value?.length || 0
      }
      reader.cancel?.()

      const elapsedSec = (Date.now() - startTime) / 1000
      const mbps = elapsedSec > 0 ? (totalBytes * 8) / 1e6 / elapsedSec : 0
      setDownloadMbps(mbps.toFixed(2))
    } catch (e) {
      setError(e.message || 'Test failed')
    }
    setStatus('done')
  }

  return (
    <div className={styles.speedTest}>
      <h3 className={styles.title}>NETWORK SPEED</h3>
      {status === 'idle' && (
        <button type="button" className={styles.runBtn} onClick={runTest}>
          RUN SPEED TEST
        </button>
      )}
      {status === 'running' && (
        <div className={styles.running}>Testing download speed...</div>
      )}
      {status === 'done' && downloadMbps !== null && (
        <div className={styles.result}>
          <span className={styles.speed}>{downloadMbps} Mbps</span>
          <span className={styles.label}>DOWNLOAD</span>
        </div>
      )}
      {status === 'done' && error && (
        <p className={styles.error}>{error}</p>
      )}
      {status === 'done' && (
        <button type="button" className={styles.retryBtn} onClick={runTest}>
          TEST AGAIN
        </button>
      )}
    </div>
  )
}
