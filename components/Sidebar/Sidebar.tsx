'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.scss';
import { navItems } from '../../data/navigation';
import Icon from '../ui/Icon';

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {isMobile && mobileOpen && (
        <div className={styles.overlay} onClick={onMobileClose} />
      )}
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${isMobile && mobileOpen ? styles.mobileOpen : ''} ${isMobile ? styles.mobile : ''}`}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Icon name="Store" size={24} />
          </div>
          {!collapsed && <span className={styles.logoText}>POS Pro</span>}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                title={collapsed ? item.label : undefined}
                onClick={isMobile ? onMobileClose : undefined}
              >
                <span className={styles.navIcon}>
                  <Icon name={item.icon} size={20} />
                </span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                {!collapsed && isActive && <span className={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <Link
            href="/help"
            className={styles.navLink}
            title={collapsed ? 'Help' : undefined}
          >
            <span className={styles.navIcon}>
              <Icon name="HelpCircle" size={20} />
            </span>
            {!collapsed && <span className={styles.navLabel}>Help</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
