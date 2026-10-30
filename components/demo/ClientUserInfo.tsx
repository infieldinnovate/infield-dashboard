"use client";

import React from "react";
import { useAuth } from "@/app/providers";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import styles from "./ClientUserInfo.module.scss";

export default function ClientUserInfo() {
  const user = useAuth();

  if (!user) {
    return (
      <Card padding="lg">
        <p className={styles.empty}>No user in context.</p>
      </Card>
    );
  }

  return (
    <Card padding="lg" className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Client-Side User (via useAuth)</h3>
        <Badge variant="success" size="sm">From Context</Badge>
      </div>
      <div className={styles.grid}>
        <div className={styles.field}>
          <span className={styles.label}>Name</span>
          <span className={styles.value}>{user.name}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Email</span>
          <span className={styles.value}>{user.email}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>User ID</span>
          <span className={styles.value}>{user.id}</span>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Role</span>
          <span className={styles.value}>{user.role}</span>
        </div>
      </div>
    </Card>
  );
}
