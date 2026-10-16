import React from "react";
import styles from "./stamp.module.scss";

interface StampProps {
  date?: string;
}

export default function Stamp({ date = "** *** ****" }: StampProps) {
  return (
    <div className={styles.stamp}>
      <span className={styles.date}>{date}</span>
    </div>
  );
}
