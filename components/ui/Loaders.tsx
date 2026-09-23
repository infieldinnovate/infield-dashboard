'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        minHeight: '60vh',
        color: 'var(--neutral-400)',
      }}
    >
      <LoadingSpinner size="lg" />
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
    </div>
  );
}

interface ButtonLoaderProps {
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function ButtonLoader({
  label = 'Loading...',
  variant = 'primary',
  size = 'md',
}: ButtonLoaderProps) {
  const heights: Record<string, number> = { sm: 32, md: 40, lg: 48 };
  const fontSizes: Record<string, number> = { sm: 13, md: 14, lg: 15 };
  const bg: Record<string, string> = {
    primary: 'var(--primary-600)',
    secondary: 'var(--neutral-100)',
    ghost: 'transparent',
    outline: 'transparent',
  };
  const color: Record<string, string> = {
    primary: 'var(--neutral-0)',
    secondary: 'var(--neutral-700)',
    ghost: 'var(--neutral-600)',
    outline: 'var(--primary-600)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        height: heights[size],
        padding: '0 16px',
        borderRadius: 'var(--radius-md)',
        background: bg[variant],
        color: color[variant],
        fontSize: fontSizes[size],
        fontWeight: 600,
        border: variant === 'outline' ? '1px solid var(--primary-300)' : 'none',
      }}
    >
      <LoadingSpinner size="sm" />
      {label}
    </span>
  );
}

interface OverlayLoaderProps {
  message?: string;
  transparent?: boolean;
}

export function OverlayLoader({ message, transparent = false }: OverlayLoaderProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: transparent ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(2px)',
        zIndex: 50,
        borderRadius: 'inherit',
      }}
    >
      <LoadingSpinner size="md" />
      {message && (
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--neutral-500)' }}>
          {message}
        </span>
      )}
    </div>
  );
}

interface TableLoaderProps {
  rows?: number;
  columns?: number;
}

export function TableLoader({ rows = 5, columns = 5 }: TableLoaderProps) {
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '12px',
          padding: '12px 16px',
          borderBottom: '1px solid var(--neutral-200)',
          background: 'var(--neutral-50)',
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`th-${i}`} width="60%" height={14} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '12px',
            padding: '14px 16px',
            borderBottom: '1px solid var(--neutral-100)',
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`cell-${rowIdx}-${colIdx}`}
              width={colIdx === 0 ? '80%' : '50%'}
              height={14}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = false,
  className,
  style,
}: SkeletonProps) {
  return (
    <span
      className={className}
      style={{
        display: 'block',
        width,
        height,
        borderRadius: rounded ? '9999px' : 'var(--radius-sm)',
        background: 'linear-gradient(90deg, var(--neutral-100) 25%, var(--neutral-50) 50%, var(--neutral-100) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeletonShimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

interface SkeletonCardProps {
  lines?: number;
  title?: boolean;
  avatar?: boolean;
}

export function SkeletonCard({ lines = 3, title = true, avatar = false }: SkeletonCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--neutral-0)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {avatar && <Skeleton width={40} height={40} rounded />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {title && <Skeleton width="60%" height={18} />}
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={14} />
      ))}
    </div>
  );
}

interface SkeletonTextProps {
  lines?: number;
}

export function SkeletonText({ lines = 3 }: SkeletonTextProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={14} />
      ))}
    </div>
  );
}

export default PageLoader;
