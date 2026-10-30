'use client';

import React from 'react';
import Icon from './Icon';
import styles from './PaginationFooter.module.scss';

interface PaginationFooterProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  siblingCount?: number;
}

export default function PaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  siblingCount = 1,
}: PaginationFooterProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

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

  return (
    <div className={styles.footer}>
      <div className={styles.left}>
        <div className={styles.sizeSelector}>
          <label className={styles.label}>Rows per page</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <Icon name="ChevronDown" size={14} className={styles.selectIcon} />
          </div>
        </div>
        <span className={styles.info}>
          {totalItems === 0
            ? 'No items'
            : `${startItem}–${endItem} of ${totalItems}`}
        </span>
      </div>
      {totalPages > 1 && (
        <div className={styles.right}>
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
      )}
    </div>
  );
}