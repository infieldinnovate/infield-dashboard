"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import { updateProfileAction } from "./actions";
import styles from "./ServerActionDemo.module.scss";

export default function ServerActionDemo() {
  const user = useAuth();
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const res = await updateProfileAction();
      if (res.success) {
        setResult(res.message);
        toast.success(res.message);
      } else {
        setResult(res.error);
        toast.error(res.error);
      }
    } catch {
      setResult("Action failed");
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg" className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Server Action Demo</h3>
        <Badge variant="info" size="sm">Server-side check</Badge>
      </div>

      <div className={styles.clientInfo}>
        <span className={styles.label}>Client-side user (useAuth):</span>
        <span className={styles.value}>
          {user ? `${user.name} — ${user.role}` : "No user in context"}
        </span>
      </div>

      <Button onClick={handleAction} loading={loading} size="sm">
        Call updateProfileAction()
      </Button>

      {result && (
        <div className={styles.result}>
          <span className={styles.resultLabel}>Result:</span>
          <span className={styles.resultValue}>{result}</span>
        </div>
      )}
    </Card>
  );
}
