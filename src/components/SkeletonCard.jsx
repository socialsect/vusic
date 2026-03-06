import styles from '../styles/SkeletonCard.module.css'

export function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.thumb} />
      <div className={styles.line1} />
      <div className={styles.line2} />
    </div>
  )
}
