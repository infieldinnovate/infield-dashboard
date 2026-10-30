import React from "react";
import { requireUser } from "@/lib/auth";
import PageHeader from "../../../components/ui/PageHeader";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Avatar from "../../../components/ui/Avatar";
import styles from "./page.module.scss";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className={styles.page}>
      <PageHeader
        title="My Profile"
        subtitle="Virtual user profile details"
      />

      <Card padding="lg" className={styles.profileCard}>
        <div className={styles.profileTop}>
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>{user.name}</h2>
            <span className={styles.profileEmail}>{user.email}</span>
            <div className={styles.profileBadges}>
              <Badge variant="primary" size="sm">{user.role}</Badge>
              <Badge variant="success" size="sm">Active</Badge>
            </div>
          </div>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>User ID</span>
            <span className={styles.detailValue}>{user.id}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Full Name</span>
            <span className={styles.detailValue}>{user.name}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Email</span>
            <span className={styles.detailValue}>{user.email}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Role</span>
            <span className={styles.detailValue}>{user.role}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Avatar</span>
            <span className={styles.detailValue}>{user.avatar ?? "—"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
