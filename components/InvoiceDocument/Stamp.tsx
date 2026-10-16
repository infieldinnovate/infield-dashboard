import React from "react";
import styles from "./stamp.module.scss";

interface StampProps {
  date?: string;
}

export default function Stamp({ date = '26/Nov/2026' }: StampProps) {
  return (
    <div className={styles.stamp}>
      <span className={styles.date}>{date}</span>
    </div>
  );
}
