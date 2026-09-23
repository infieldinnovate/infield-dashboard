'use client';

import React, { useState, useCallback } from 'react';
import styles from './SearchBar.module.scss';
import Icon from './Icon';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  debounce?: number;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
  onSearch,
  debounce = 0,
  className = '',
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);

      if (debounce > 0) {
        const timeout = setTimeout(() => onSearch?.(newValue), debounce);
        return () => clearTimeout(timeout);
      } else {
        onSearch?.(newValue);
      }
    },
    [controlledValue, onChange, onSearch, debounce]
  );

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(value);
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      <span className={styles.icon}>
        <Icon name="Search" size={18} />
      </span>
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {value && (
        <button className={styles.clear} onClick={handleClear} aria-label="Clear search">
          <Icon name="X" size={16} />
        </button>
      )}
    </div>
  );
}
