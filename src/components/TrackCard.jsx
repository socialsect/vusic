import styles from '../styles/TrackCard.module.css'

export function TrackCard({ track, onClick, noBorder }) {
  if (!track) return null
  const { thumbnail, title, channel, duration } = track
  return (
    <button
      type="button"
      className={`${styles.card} ${noBorder ? styles.noBorder : ''}`}
      onClick={() => onClick?.(track)}
    >
      <div className={styles.thumbWrap}>
        <img
          src={thumbnail || ''}
          alt=""
          className={styles.thumb}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{title || 'Unknown'}</div>
        <div className={styles.meta}>
          <span className={styles.channel}>{channel || 'Unknown'}</span>
          {duration ? (
            <span className={styles.duration}>{duration}</span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
