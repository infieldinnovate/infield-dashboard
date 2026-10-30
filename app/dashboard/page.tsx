import React from "react";
import { requireUser } from "@/lib/auth";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Avatar from "../../components/ui/Avatar";
import ClientUserInfo from "../../components/demo/ClientUserInfo";
import ServerActionDemo from "./ServerActionDemo";
import styles from "./page.module.scss";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Dashboard"
        subtitle="Virtual authentication is active — you are signed in as a mock user"
      />

      <Card padding="lg" className={styles.userCard}>
        <div className={styles.userTop}>
          <Avatar name={user.name} src={user.avatar} size="lg" />
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{user.name}</h2>
            <span className={styles.userEmail}>{user.email}</span>
            <div className={styles.userBadges}>
              <Badge variant="success" size="sm">Authenticated</Badge>
              <Badge variant="primary" size="sm">{user.role}</Badge>
            </div>
          </div>
        </div>

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>User ID</span>
            <span className={styles.infoValue}>{user.id}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Role</span>
            <span className={styles.infoValue}>{user.role}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{user.email}</span>
          </div>
        </div>
      </Card>

      <div className={styles.sectionLabel}>
        Client-Side Access Proof
      </div>
      <ClientUserInfo />

      <div className={styles.sectionLabel}>
        Server Action Demo
      </div>
      <ServerActionDemo />
    </div>
  );
}
