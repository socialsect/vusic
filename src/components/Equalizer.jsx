import styles from '../styles/Equalizer.module.css'

export function Equalizer() {
  return (
    <div className={styles.equalizer} aria-hidden="true">
      <span className={styles.bar} />
      <span className={styles.bar} />
      <span className={styles.bar} />
    </div>
  )
}
