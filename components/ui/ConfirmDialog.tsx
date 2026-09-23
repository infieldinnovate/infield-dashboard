'use client';

import React from 'react';
import styles from './ConfirmDialog.module.scss';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const iconMap = {
    danger: 'AlertTriangle',
    warning: 'AlertCircle',
    info: 'Info',
  };

  const confirmVariantMap = {
    danger: 'danger',
    warning: 'primary',
    info: 'primary',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariantMap[variant] as 'danger' | 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={`${styles.icon} ${styles[variant]}`}>
          <Icon name={iconMap[variant]} size={28} />
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
}
