import React from 'react';
import { ImageWithFallback } from './ImageWithFallback';
import styles from './Avatar.module.scss';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`${styles.avatar} ${styles[size]} ${className}`}>
      {src ? (
        <ImageWithFallback
          src={src}
          alt={name}
          fill
          animation="none"
          className={styles.image}
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
}
