import React from "react";
import Card from "../../components/ui/Card";
import styles from "./page.module.scss";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Card padding="lg" className={styles.loginCard}>
        <h1 className={styles.title}>Authentication Required</h1>
        <p className={styles.message}>
          You are not authenticated. Virtual authentication is disabled.
        </p>
        <p className={styles.hint}>
          To enable the virtual login, set <code className={styles.code}>MOCK_AUTH=true</code> in
          your <code className={styles.code}>.env.local</code> file and run the app in development mode.
        </p>
      </Card>
    </div>
  );
}
