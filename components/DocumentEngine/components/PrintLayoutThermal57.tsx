'use client';

import React from 'react';
import type { DocumentConfig } from '../types';
import { getSettings, formatCurrency, formatDateShort, paymentMethodLabels } from '../types';
import styles from '../DocumentEngine.module.scss';

interface PrintLayoutThermal57Props {
  config: DocumentConfig;
  cashierName?: string;
}

export default function PrintLayoutThermal57({ config, cashierName = 'Admin' }: PrintLayoutThermal57Props) {
  const settings = getSettings();
  const { businessName, address, phone } = settings.business;
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={styles.thermalContainer}>
      <div className={styles.thermalHeader}>
        <p className={styles.thermalBusinessName}>{businessName.toUpperCase()}</p>
        <p className={styles.thermalBusinessAddr}>{address}</p>
        <p className={styles.thermalBusinessPhone}>{phone}</p>
      </div>

      <div className={styles.thermalDivider} />

      <div className={styles.thermalInfo}>
        <div className={styles.thermalInfoRow}>
          <span>Receipt #</span><span>{config.documentNumber}</span>
        </div>
        <div className={styles.thermalInfoRow}>
          <span>Date</span><span>{formatDateShort(config.date)}</span>
        </div>
        <div className={styles.thermalInfoRow}>
          <span>Time</span><span>{time}</span>
        </div>
        <div className={styles.thermalInfoRow}>
          <span>Cashier</span><span>{cashierName}</span>
        </div>
        <div className={styles.thermalInfoRow}>
          <span>Customer</span><span>{config.customer.name}</span>
        </div>
      </div>

      <div className={styles.thermalDivider} />

      {config.items.map((item, i) => (
        <div key={i} className={styles.thermalItem}>
          <div className={styles.thermalItemName}>{item.productName}</div>
          <div className={styles.thermalItemRow}>
            <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
            <span>{formatCurrency(item.total)}</span>
          </div>
        </div>
      ))}

      <div className={styles.thermalDivider} />

      <div className={styles.thermalTotals}>
        {config.totals && (
          <>
            <div className={styles.thermalTotalRow}>
              <span>Subtotal</span><span>{formatCurrency(config.totals.subtotal)}</span>
            </div>
            <div className={styles.thermalTotalRow}>
              <span>Tax</span><span>{formatCurrency(config.totals.tax)}</span>
            </div>
          </>
        )}
        {config.amount !== undefined && (
          <div className={styles.thermalTotalRow}>
            <span>Amount</span><span>{formatCurrency(config.amount)}</span>
          </div>
        )}
        <div className={`${styles.thermalTotalRow} ${styles.thermalGrandTotal}`}>
          <span>TOTAL</span><span>{formatCurrency(config.totals?.total ?? config.amount ?? 0)}</span>
        </div>
      </div>

      {config.paymentMethod && (
        <div className={styles.thermalPaymentMethod}>
          Payment: {paymentMethodLabels[config.paymentMethod] || config.paymentMethod.toUpperCase()}
        </div>
      )}

      <div className={styles.thermalDivider} />

      <div className={styles.thermalThankYou}>
        <p>THANK YOU!</p>
        <p>Please come again</p>
        <p className={styles.thermalPoweredBy}>Powered by {businessName}</p>
      </div>

      <div className={styles.thermalCutLine}>--- tear here ---</div>
    </div>
  );
}
