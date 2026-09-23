'use client';

import React from 'react';
import Select from './Select';
import Button from './Button';
import Icon from './Icon';
import Input from './Input';
import { ReportPeriod } from '../../types';
import { reportPeriodOptions } from '../../data/reports';
import styles from './ReportToolbar.module.scss';

interface ReportToolbarProps {
  period: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPrint: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

export default function ReportToolbar({
  period,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPrint,
  onExportCSV,
  onExportPDF,
}: ReportToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filters}>
        <Select
          options={reportPeriodOptions}
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as ReportPeriod)}
          className={styles.periodSelect}
        />
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={styles.dateInput}
        />
        <span className={styles.dateSeparator}>to</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className={styles.dateInput}
        />
      </div>
      <div className={styles.actions}>
        <Button variant="outline" size="sm" leftIcon={<Icon name="Printer" size={16} />} onClick={onPrint}>
          Print
        </Button>
        <Button variant="outline" size="sm" leftIcon={<Icon name="FileDown" size={16} />} onClick={onExportCSV}>
          CSV
        </Button>
        <Button variant="outline" size="sm" leftIcon={<Icon name="FileText" size={16} />} onClick={onExportPDF}>
          PDF
        </Button>
      </div>
    </div>
  );
}
