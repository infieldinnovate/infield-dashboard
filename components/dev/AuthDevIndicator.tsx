"use client";

import React from "react";
import { useAuth } from "@/app/providers";
import styles from "./AuthDevIndicator.module.scss";

export default function AuthDevIndicator({ enabled }: { enabled: boolean }) {
  const user = useAuth();

  if (!enabled) return null;

  return (
    <div className={styles.indicator}>
      <div className={styles.row}>
        <span className={styles.dot} />
        <span className={styles.text}>
          {user ? "Mock Auth: ENABLED" : "Mock Auth: DISABLED"}
        </span>
      </div>
      {user && (
        <div className={styles.userInfo}>
          {user.name} · {user.role}
        </div>
      )}
    </div>
  );
}
