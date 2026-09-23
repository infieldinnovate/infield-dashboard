'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.scss';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/ui/Icon';
import Avatar from '../../../components/ui/Avatar';
import EmptyState from '../../../components/ui/EmptyState';
import { users } from '../../../data/users';
import { activityLogs, permissionGroups } from '../../../data/roles';
import type { ActivityLog } from '../../../types';

const roleColor: Record<string, 'primary' | 'secondary' | 'success' | 'info'> = {
  admin: 'primary',
  manager: 'secondary',
  cashier: 'success',
  sales: 'info',
};

const categoryColor: Record<ActivityLog['category'], 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'default'> = {
  auth: 'info',
  sales: 'success',
  inventory: 'warning',
  customers: 'primary',
  settings: 'secondary',
  documents: 'default',
};

const categoryIcon: Record<ActivityLog['category'], string> = {
  auth: 'LogIn',
  sales: 'ShoppingCart',
  inventory: 'Boxes',
  customers: 'Users',
  settings: 'Settings',
  documents: 'FileText',
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const user = users.find((u) => u.id === userId);

  const [tab, setTab] = useState<'overview' | 'permissions' | 'activity'>('overview');

  const userLogs = useMemo(() => activityLogs.filter((l) => l.userId === userId), [userId]);

  const userPerms = useMemo(() => {
    if (!user) return [];
    if (user.permissions[0] === 'all') return permissionGroups.flatMap((g) => g.permissions.map((p) => p.id));
    return user.permissions;
  }, [user]);

  if (!user) {
    return (
      <div className={styles.page}>
        <EmptyState
          icon="UserX"
          title="User not found"
          message="The user you are looking for does not exist."
          action={<Link href="/users"><Button leftIcon={<Icon name="ArrowLeft" size={16} />}>Back to Users</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href="/users" className={styles.backLink}>
        <Icon name="ArrowLeft" size={16} />
        Back to Users
      </Link>

      {/* Profile header */}
      <Card padding="lg" className={styles.profileHeader}>
        <div className={styles.profileTop}>
          <Avatar name={user.name} size="lg" className={styles.profileAvatar} />
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{user.name}</h1>
            <span className={styles.profileEmail}>{user.email}</span>
            <div className={styles.profileBadges}>
              <Badge variant={roleColor[user.role]} size="sm">{user.role}</Badge>
              <Badge variant={user.status === 'active' ? 'success' : 'default'} size="sm">{user.status}</Badge>
            </div>
          </div>
          <div className={styles.profileActions}>
            <Button variant="outline" size="sm" leftIcon={<Icon name="Pencil" size={16} />}>Edit Profile</Button>
            <Button variant="ghost" size="sm" leftIcon={<Icon name={user.status === 'active' ? 'UserX' : 'UserCheck'} size={16} />}>
              {user.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className={styles.statsRow}>
        <Card padding="md" className={styles.statCard}>
          <span className={styles.statIcon}><Icon name="Activity" size={20} /></span>
          <div>
            <span className={styles.statValue}>{userLogs.length}</span>
            <span className={styles.statLabel}>Total Actions</span>
          </div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <span className={styles.statIcon}><Icon name="Lock" size={20} /></span>
          <div>
            <span className={styles.statValue}>{userPerms.length}</span>
            <span className={styles.statLabel}>Permissions</span>
          </div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <span className={styles.statIcon}><Icon name="Calendar" size={20} /></span>
          <div>
            <span className={styles.statValue}>{user.createdAt}</span>
            <span className={styles.statLabel}>Joined</span>
          </div>
        </Card>
        <Card padding="md" className={styles.statCard}>
          <span className={styles.statIcon}><Icon name="LogIn" size={20} /></span>
          <div>
            <span className={styles.statValue}>{user.lastLogin.split(' ')[0]}</span>
            <span className={styles.statLabel}>Last Login</span>
          </div>
        </Card>
      </div>

      {/* Sub-tabs */}
      <div className={styles.tabBar}>
        {([
          { id: 'overview', label: 'Overview', icon: 'User' },
          { id: 'permissions', label: 'Permissions', icon: 'Lock' },
          { id: 'activity', label: 'Activity', icon: 'Activity' },
        ] as const).map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className={styles.tabIcon}><Icon name={t.icon} size={18} /></span>
            <span className={styles.tabLabel}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <Card padding="lg">
          <h3 className={styles.sectionTitle}>Contact Information</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}><Icon name="Mail" size={18} /></span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user.email}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}><Icon name="Phone" size={18} /></span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{user.phone}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}><Icon name="ShieldCheck" size={18} /></span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Role</span>
                <span className={styles.infoValue}>{user.role}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}><Icon name="Calendar" size={18} /></span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Member Since</span>
                <span className={styles.infoValue}>{user.createdAt}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}><Icon name="LogIn" size={18} /></span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Last Login</span>
                <span className={styles.infoValue}>{user.lastLogin}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}><Icon name="CircleDot" size={18} /></span>
              <div className={styles.infoContent}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue}>{user.status}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Permissions */}
      {tab === 'permissions' && (
        <Card padding="lg">
          <h3 className={styles.sectionTitle}>Assigned Permissions</h3>
          <div className={styles.permList}>
            {permissionGroups.map((group) => {
              const groupPerms = group.permissions.filter((p) => userPerms.includes(p.id));
              if (groupPerms.length === 0 && userPerms[0] !== 'all') return null;
              return (
                <div key={group.module} className={styles.permGroup}>
                  <div className={styles.permGroupHeader}>
                    <span className={styles.permGroupIcon}><Icon name={group.icon} size={18} /></span>
                    <span className={styles.permGroupName}>{group.module}</span>
                  </div>
                  <div className={styles.permTags}>
                    {userPerms[0] === 'all' ? (
                      group.permissions.map((p) => (
                        <Badge key={p.id} variant="primary" size="sm">{p.label}</Badge>
                      ))
                    ) : (
                      groupPerms.map((p) => (
                        <Badge key={p.id} variant="primary" size="sm">{p.label}</Badge>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <Card padding="none">
          <div className={styles.activityList}>
            {userLogs.length > 0 ? (
              userLogs.map((log) => (
                <div key={log.id} className={styles.activityItem}>
                  <span className={`${styles.activityIcon} ${styles[categoryColor[log.category]]}`}>
                    <Icon name={categoryIcon[log.category]} size={16} />
                  </span>
                  <div className={styles.activityContent}>
                    <div className={styles.activityTop}>
                      <span className={styles.activityAction}>{log.action}</span>
                      <Badge variant={categoryColor[log.category]} size="sm">{log.category}</Badge>
                    </div>
                    <span className={styles.activityDetail}>{log.detail}</span>
                    <div className={styles.activityMeta}>
                      <span className={styles.activityTime}>{log.timestamp}</span>
                      <span className={styles.activityIp}>IP: {log.ip}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyWrap}>
                <EmptyState icon="Activity" title="No activity yet" message="This user has no recorded actions." />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
