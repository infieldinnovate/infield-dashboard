'use client';

import React from 'react';
import styles from './Table.module.scss';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyText?: string;
  striped?: boolean;
  compact?: boolean;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyText = 'No data available',
  striped = true,
  compact = false,
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyText}>{emptyText}</span>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <table className={`${styles.table} ${striped ? styles.striped : ''} ${compact ? styles.compact : ''}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${styles.th} ${col.align ? styles[col.align] : ''}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              className={`${styles.tr} ${onRowClick ? styles.clickable : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${styles.td} ${col.align ? styles[col.align] : ''}`}
                >
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
