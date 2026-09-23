'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './DashboardLayout.module.scss';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import GlobalSearch from '../GlobalSearch/GlobalSearch';

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/pos': 'Point of Sale',
  '/products': 'Products',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/receipts': 'Receipts',
  '/delivery-notes': 'Delivery Notes',
  '/inbox': 'Inbox',
  '/users': 'Users',
  '/leads': 'Lead Portfolios',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  };

  const title = titleMap[pathname] || 'Dashboard';

  return (
    <div className={styles.container}>
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={`${styles.main} ${sidebarCollapsed ? styles.mainCollapsed : ''}`}
      >
        <Header
          title={title}
          onMenuToggle={handleMenuToggle}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <main className={styles.content}>{children}</main>
      </div>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
