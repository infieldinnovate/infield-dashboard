import React from 'react';
import Card from '../../ui/Card';
import Icon from '../../ui/Icon';
import styles from './SettingsForms.module.scss';

interface SectionCardProps {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
}

export default function SectionCard({ title, description, icon, children }: SectionCardProps) {
  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>
          <Icon name={icon} size={22} />
        </span>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionDescription}>{description}</p>
        </div>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </Card>
  );
}
