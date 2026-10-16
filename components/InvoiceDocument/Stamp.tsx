import React from "react";
import styles from "./stamp.module.scss";

export default function Stamp() {
  return (
    <div className={styles.stamp}>
      <span className={styles.date}>26/Nov/2026</span>
    </div>
  );
}
