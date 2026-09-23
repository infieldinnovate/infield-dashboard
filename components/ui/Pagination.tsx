'use client';

import React from 'react';
import styles from './Pagination.module.scss';
import Icon from './Icon';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: PaginationProps) {
  const getPages = () => {
    const pages: (number | string)[] = [];
    const start = Math.max(1, currentPage - siblingCount);
    const end = Math.min(totalPages, currentPage + siblingCount);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.arrow}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <Icon name="ChevronLeft" size={16} />
      </button>
      <div className={styles.pages}>
        {getPages().map((page, i) =>
          typeof page === 'string' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>...</span>
          ) : (
            <button
              key={page}
              className={`${styles.page} ${currentPage === page ? styles.active : ''}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          )
        )}
      </div>
      <button
        className={styles.arrow}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <Icon name="ChevronRight" size={16} />
      </button>
    </div>
  );
}
