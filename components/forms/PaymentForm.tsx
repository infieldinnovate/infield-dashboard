'use client';

import React, { useState, useEffect } from 'react';
import InputField from './form_elements/input';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import type { Invoice } from '../../types';
import { formatCurrency } from '../../lib/documentUtils';
import styles from './PaymentForm.module.scss';

interface PaymentFormProps {
  invoice: Invoice | null;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

export default function PaymentForm({ invoice, onConfirm, onClose }: PaymentFormProps) {
  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    if (invoice) {
      setPaymentAmount(String(invoice.balance));
    } else {
      setPaymentAmount('');
    }
  }, [invoice]);

  const handleConfirm = () => {
    const amount = parseFloat(paymentAmount) || 0;
    onConfirm(amount);
  };

  return (
    <Modal
      isOpen={!!invoice}
      onClose={onClose}
      title="Record Payment"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Record Payment</Button>
        </>
      }
    >
      {invoice && (
        <div className={styles.paymentForm}>
          <div className={styles.paymentInfo}>
            <div className={styles.paymentRow}>
              <span>Invoice</span>
              <span className={styles.paymentValue}>{invoice.invoiceNumber}</span>
            </div>
            <div className={styles.paymentRow}>
              <span>Total Amount</span>
              <span className={styles.paymentValue}>{formatCurrency(invoice.total)}</span>
            </div>
            <div className={styles.paymentRow}>
              <span>Already Paid</span>
              <span className={styles.paymentValue}>{formatCurrency(invoice.paid)}</span>
            </div>
            <div className={styles.paymentRow}>
              <span>Balance Due</span>
              <span className={styles.paymentValue}>{formatCurrency(invoice.balance)}</span>
            </div>
          </div>
          <InputField
            label="Payment Amount"
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Enter payment amount"
          />
          <div className={styles.paymentActions}>
            <Button size="sm" variant="ghost" onClick={() => setPaymentAmount(String(invoice.balance))}>
              Pay Full Balance
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
