'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Dropdown.module.scss';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'right' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex((i) => {
        const next = Math.min(i + 1, items.length - 1);
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex((i) => {
        const next = Math.max(i - 1, 0);
        itemRefs.current[next]?.focus();
        return next;
      });
    }
  };

  return (
    <div className={styles.wrapper} ref={ref} onKeyDown={handleKeyDown}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>
      {open && (
        <div className={`${styles.menu} ${styles[align]}`} role="menu">
          {items.map((item, i) => (
            <button
              key={item.id}
              ref={(el) => { itemRefs.current[i] = el; }}
              className={`${styles.item} ${item.danger ? styles.danger : ''} ${item.disabled ? styles.disabled : ''}`}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  close();
                }
              }}
              disabled={item.disabled}
              type="button"
              role="menuitem"
            >
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              <span className={styles.itemLabel}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
