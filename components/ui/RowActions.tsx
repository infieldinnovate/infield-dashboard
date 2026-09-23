'use client';

import React from 'react';
import Icon from './Icon';
import styles from './RowActions.module.scss';

interface RowAction {
  icon: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}

interface RowActionsProps {
  actions: RowAction[];
}

export default function RowActions({ actions }: RowActionsProps) {
  return (
    <div className={styles.actions}>
      {actions.map((action, i) => (
        <button
          key={i}
          className={`${styles.actionBtn} ${action.variant === 'danger' ? styles.danger : ''}`}
          onClick={action.onClick}
          title={action.label}
          aria-label={action.label}
        >
          <Icon name={action.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
