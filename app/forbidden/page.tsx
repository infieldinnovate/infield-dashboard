import React from "react";
import Card from "../../components/ui/Card";
import styles from "./page.module.scss";

export default function ForbiddenPage() {
  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.forbiddenCard}>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.message}>
          You do not have permission to view this page. Your account role does
          not meet the required access level.
        </p>
        <p className={styles.hint}>
          If you believe this is an error, contact your administrator.
        </p>
      </Card>
    </div>
  );
}
