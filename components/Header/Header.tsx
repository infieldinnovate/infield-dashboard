'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.scss';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { notifications as initialNotifications } from '../../data/notifications';
import { Notification } from '../../types';

interface HeaderProps {
  title?: string;
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

export default function Header({ title = 'Dashboard', onMenuToggle, onSearchOpen }: HeaderProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [notifList, setNotifList] = useState<Notification[]>(initialNotifications);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifList.filter((n) => !n.read).length;

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    if (notifOpen || userOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notifOpen, userOpen]);

  const handleNotifClick = (notif: Notification) => {
    setNotifList((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setSelectedNotif(notif);
    setNotifOpen(false);
  };

  const markAllRead = () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuButton} onClick={onMenuToggle} aria-label="Toggle menu">
          <Icon name="Menu" size={20} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        <button className={styles.searchButton} onClick={onSearchOpen} aria-label="Search">
          <span className={styles.searchButtonIcon}>
            <Icon name="Search" size={18} />
          </span>
          <span className={styles.searchButtonText}>Search...</span>
          <kbd className={styles.searchKbd}>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>

        {/* Notifications */}
        <div className={styles.notifWrapper} ref={notifRef}>
          <button
            className={`${styles.iconButton} ${notifOpen ? styles.iconButtonActive : ''}`}
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Icon name="Bell" size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <div className={styles.notifHeaderLeft}>
                  <span className={styles.notifTitle}>Notifications</span>
                  <span className={styles.notifCount}>{unreadCount} unread</span>
                </div>
                <div className={styles.notifHeaderRight}>
                  {unreadCount > 0 && (
                    <button className={styles.markAllBtn} onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                  <button className={styles.closeBtn} onClick={() => setNotifOpen(false)} aria-label="Close">
                    <Icon name="X" size={16} />
                  </button>
                </div>
              </div>
              <div className={styles.notifList}>
                {notifList.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    className={`${styles.notifItem} ${!notif.read ? styles.notifUnread : ''}`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <div className={`${styles.notifIcon} ${styles[notif.type]}`}>
                      <Icon name={notif.icon} size={16} />
                    </div>
                    <div className={styles.notifContent}>
                      <span className={styles.notifItemTitle}>{notif.title}</span>
                      <span className={styles.notifItemMessage}>{notif.message}</span>
                      <span className={styles.notifItemTime}>{notif.createdAt}</span>
                    </div>
                    {!notif.read && <span className={styles.unreadDot} />}
                  </div>
                ))}
              </div>
              <div className={styles.notifFooter}>
                <Button variant="ghost" size="sm" onClick={() => setNotifOpen(false)}>
                  View all notifications
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* User Avatar Dropdown */}
        <div className={styles.userWrapper} ref={userRef}>
          <button
            className={`${styles.user} ${userOpen ? styles.userActive : ''}`}
            onClick={() => setUserOpen((v) => !v)}
          >
            <div className={styles.userInfo}>
              <span className={styles.userName}>Alex Morgan</span>
              <span className={styles.userRole}>Manager</span>
            </div>
            <Avatar name="Alex Morgan" size="md" />
            <Icon name="ChevronDown" size={16} className={styles.userChevron} />
          </button>
          {userOpen && (
            <div className={styles.userDropdown}>
              <div className={styles.userDropdownHeader}>
                <Avatar name="Alex Morgan" size="lg" />
                <div className={styles.userDropdownInfo}>
                  <span className={styles.userDropdownName}>Alex Morgan</span>
                  <span className={styles.userDropdownEmail}>admin@infieldinnovations.com</span>
                </div>
              </div>
              <div className={styles.userDropdownBody}>
                <button
                  className={styles.userMenuItem}
                  onClick={() => { setUserOpen(false); router.push('/settings'); }}
                >
                  <Icon name="User" size={18} />
                  <span>Profile</span>
                </button>
                <button
                  className={styles.userMenuItem}
                  onClick={() => { setUserOpen(false); router.push('/settings'); }}
                >
                  <Icon name="Settings" size={18} />
                  <span>Settings</span>
                </button>
                <div className={styles.userMenuDivider} />
                <button
                  className={`${styles.userMenuItem} ${styles.userMenuLogout}`}
                  onClick={() => { setUserOpen(false); router.push('/'); }}
                >
                  <Icon name="LogOut" size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Detail Modal */}
      <Modal
        isOpen={!!selectedNotif}
        onClose={() => setSelectedNotif(null)}
        title="Notification Details"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedNotif(null)}>Close</Button>
            {selectedNotif?.link && (
              <Button
                leftIcon={<Icon name="ExternalLink" size={16} />}
                onClick={() => {
                  if (selectedNotif.link) router.push(selectedNotif.link);
                  setSelectedNotif(null);
                }}
              >
                View Details
              </Button>
            )}
          </>
        }
      >
        {selectedNotif && (
          <div className={styles.notifDetail}>
            <div className={`${styles.notifDetailIcon} ${styles[selectedNotif.type]}`}>
              <Icon name={selectedNotif.icon} size={28} />
            </div>
            <h3 className={styles.notifDetailTitle}>{selectedNotif.title}</h3>
            <p className={styles.notifDetailMessage}>{selectedNotif.message}</p>
            <div className={styles.notifDetailMeta}>
              <span className={styles.notifDetailTime}>{selectedNotif.createdAt}</span>
              <span className={`notif-type-badge ${styles[`notifType${selectedNotif.type}`] || ''}`}>
                {selectedNotif.type}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </header>
  );
}
