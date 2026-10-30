'use client';

import React from 'react';
import Pagination from './Pagination';
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
      <div className={styles.right}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          siblingCount={siblingCount}
        />
      </div>
    </div>
  );
}