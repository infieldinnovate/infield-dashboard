'use client';

import React from 'react';
import type { DocumentConfig, DocumentItem } from '../types';
import DocumentHeader from './DocumentHeader';
import DocumentCustomerInfo from './DocumentCustomerInfo';
import DocumentMetadata from './DocumentMetadata';
import DocumentItemsTable from './DocumentItemsTable';
import DocumentNotes from './DocumentNotes';
import DocumentFooter from './DocumentFooter';
import styles from '../DocumentEngine.module.scss';

const ITEMS_PER_PAGE = 12;
const ITEMS_PER_MIDDLE_PAGE = 18;

interface ReceiptLayoutProps {
  config: DocumentConfig;
}

export default function ReceiptLayout({ config }: ReceiptLayoutProps) {
  const { items } = config;

  const pages: DocumentItem[][] = [];
  if (items.length <= ITEMS_PER_PAGE) {
    pages.push(items);
  } else {
    pages.push(items.slice(0, ITEMS_PER_PAGE));
    const remaining = items.slice(ITEMS_PER_PAGE);
    for (let i = 0; i < remaining.length; i += ITEMS_PER_MIDDLE_PAGE) {
      pages.push(remaining.slice(i, i + ITEMS_PER_MIDDLE_PAGE));
    }
  }

  return (
    <div className={styles.a4Container}>
      {pages.map((pageItems, pageIndex) => {
        const isFirst = pageIndex === 0;
        const isLast = pageIndex === pages.length - 1;
        return (
          <div key={pageIndex} className={styles.a4Page}>
            {isFirst ? (
              <>
                <DocumentHeader
                  title={config.title}
                  documentNumber={config.documentNumber}
                  date={config.date}
                  dateLabel={config.dateLabel}
                  variant="full"
                />
                <DocumentCustomerInfo party={config.customer} label="Received From" />
                <DocumentMetadata entries={config.metadata} />
                <DocumentItemsTable items={pageItems} showPrices={config.showPrices} />
                {isLast && <DocumentNotes notes={config.notes} amount={config.amount} paymentMethod={config.paymentMethod} />}
                <DocumentFooter />
              </>
            ) : (
              <>
                <DocumentHeader
                  title={config.title}
                  documentNumber={config.documentNumber}
                  date={config.date}
                  dateLabel={config.dateLabel}
                  variant="compact"
                />
                <DocumentItemsTable items={pageItems} showPrices={config.showPrices} />
                {isLast && <DocumentFooter />}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
