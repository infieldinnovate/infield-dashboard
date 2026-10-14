'use client';

import React, { useState } from 'react';
import TextareaField from './form_elements/textarea';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import styles from './ReplyForm.module.scss';

interface ReplyFormProps {
  placeholder?: string;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ReplyForm({ placeholder = 'Type your reply...', onSend, disabled = false }: ReplyFormProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className={styles.replySection}>
      <span className={styles.label}>Reply</span>
      <TextareaField
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
      />
      <Button
        size="sm"
        leftIcon={<Icon name="Send" size={14} />}
        onClick={handleSend}
        disabled={disabled || !text.trim()}
      >
        Send Reply
      </Button>
    </div>
  );
}
