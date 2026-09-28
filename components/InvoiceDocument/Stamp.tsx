import React from 'react';
import styles from './stamp.module.scss';

export default function Stamp() {
  return (
    <div className={styles.stamp} aria-label="Digital stamp placeholder">
      <div className={styles.inner}>
        <span className={styles.name}>Infield</span>
        <span className={styles.stars}>★ ★ ★ ★</span>
        <span className={styles.number}>+254 702 393 677</span>
      </div>
      <span className={styles.text}>DIGITAL STAMP</span>
    </div>
  );
}
