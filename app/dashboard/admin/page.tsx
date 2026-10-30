import React from "react";
import { requireAdmin } from "@/lib/auth";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import styles from "./page.module.scss";

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Admin Panel"
        subtitle="Restricted area — admin access required"
      />

      <Card padding="lg" className={styles.adminCard}>
        <div className={styles.adminHeader}>
          <h2 className={styles.adminTitle}>Welcome, {user.name}</h2>
          <Badge variant="primary" size="sm">Admin</Badge>
        </div>
        <p className={styles.adminText}>
          You are viewing the admin panel because your virtual user has the
          &ldquo;admin&rdquo; role. If the role were not admin, you would have
          been redirected to the forbidden page.
        </p>
        <div className={styles.adminInfo}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Admin User</span>
            <span className={styles.infoValue}>{user.name}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>User ID</span>
            <span className={styles.infoValue}>{user.id}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
