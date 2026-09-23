'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.scss';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { users as initialUsers } from '../../data/users';
import { roles, permissionGroups, activityLogs } from '../../data/roles';
import type { User, ActivityLog } from '../../types';
import { toast } from 'sonner';

const tabs = [
  { id: 'users', label: 'User List', icon: 'Users' },
  { id: 'roles', label: 'Roles', icon: 'ShieldCheck' },
  { id: 'permissions', label: 'Permissions', icon: 'Lock' },
  { id: 'activity', label: 'Activity Log', icon: 'Activity' },
] as const;

type TabId = (typeof tabs)[number]['id'];

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

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('users');
  const [userList, setUserList] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    let data = [...userList];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter) data = data.filter((u) => u.role === roleFilter);
    if (statusFilter) data = data.filter((u) => u.status === statusFilter);
    return data;
  }, [userList, search, roleFilter, statusFilter]);

  const handleToggleStatus = (userId: string) => {
    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u))
    );
    toast.success('User status updated');
  };

  return (
    <div className={styles.page}>
      {/* Tab bar */}
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>
              <Icon name={tab.icon} size={18} />
            </span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Users list */}
      {activeTab === 'users' && (
        <div className={styles.section}>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Icon name="Search" size={16} />}
                className={styles.searchInput}
              />
              <Select
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'admin', label: 'Administrator' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'sales', label: 'Sales' },
                  { value: 'cashier', label: 'Cashier' },
                ]}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={styles.filterSelect}
              />
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              />
            </div>
            <Button leftIcon={<Icon name="UserPlus" size={16} />}>Add User</Button>
          </div>

          <Card padding="none">
            <Table
              columns={[
                {
                  key: 'user',
                  header: 'User',
                  render: (row: User) => (
                    <div className={styles.userCell}>
                      <Avatar name={row.name} size="md" />
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{row.name}</span>
                        <span className={styles.userEmail}>{row.email}</span>
                      </div>
                    </div>
                  ),
                },
                { key: 'role', header: 'Role', align: 'center' as const, render: (row: User) => (
                  <Badge variant={roleColor[row.role]} size="sm">{row.role}</Badge>
                ) },
                { key: 'phone', header: 'Phone', render: (row: User) => (
                  <span className={styles.mutedText}>{row.phone}</span>
                ) },
                { key: 'lastLogin', header: 'Last Login', render: (row: User) => (
                  <span className={styles.mutedText}>{row.lastLogin}</span>
                ) },
                { key: 'status', header: 'Status', align: 'center' as const, render: (row: User) => (
                  <span className={`${styles.statusDot} ${row.status === 'active' ? styles.statusActive : styles.statusInactive}`} />
                ) },
                { key: 'actions', header: '', align: 'right' as const, render: (row: User) => (
                  <div className={styles.rowActions}>
                    <Link href={`/users/${row.id}`} className={styles.rowAction} title="View profile" onClick={(e) => e.stopPropagation()}>
                      <Icon name="Eye" size={16} />
                    </Link>
                    <button className={styles.rowAction} title="Edit" onClick={(e) => { e.stopPropagation(); }}>
                      <Icon name="Pencil" size={16} />
                    </button>
                    <button
                      className={styles.rowAction}
                      title={row.status === 'active' ? 'Deactivate' : 'Activate'}
                      onClick={(e) => { e.stopPropagation(); handleToggleStatus(row.id); }}
                    >
                      <Icon name={row.status === 'active' ? 'UserX' : 'UserCheck'} size={16} />
                    </button>
                  </div>
                ) },
              ]}
              data={filteredUsers}
              keyExtractor={(row) => row.id}
              onRowClick={(row) => setSelectedUser(row)}
            />
          </Card>
          <div className={styles.resultsText}>
            {filteredUsers.length} of {userList.length} users
          </div>
        </div>
      )}

      {/* Roles */}
      {activeTab === 'roles' && (
        <div className={styles.section}>
          <div className={styles.rolesGrid}>
            {roles.map((role) => (
              <Card key={role.id} padding="lg" className={styles.roleCard}>
                <div className={styles.roleHeader}>
                  <span className={`${styles.roleIcon} ${styles[role.color]}`}>
                    <Icon name="ShieldCheck" size={22} />
                  </span>
                  <div className={styles.roleInfo}>
                    <h3 className={styles.roleName}>{role.name}</h3>
                    <Badge variant={role.color} size="sm">{role.members} member{role.members !== 1 ? 's' : ''}</Badge>
                  </div>
                </div>
                <p className={styles.roleDesc}>{role.description}</p>
                <div className={styles.rolePerms}>
                  <span className={styles.rolePermsLabel}>
                    {role.permissions[0] === 'all' ? 'Full access' : `${role.permissions.length} permissions`}
                  </span>
                  {role.permissions[0] === 'all' ? (
                    <div className={styles.permTags}>
                      <Badge variant="primary" size="sm">All Modules</Badge>
                    </div>
                  ) : (
                    <div className={styles.permTags}>
                      {role.permissions.slice(0, 4).map((p) => (
                        <Badge key={p} size="sm">{p.split('.')[0]}</Badge>
                      ))}
                      {role.permissions.length > 4 && (
                        <Badge size="sm">+{role.permissions.length - 4} more</Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.roleActions}>
                  <Button variant="ghost" size="sm" leftIcon={<Icon name="Pencil" size={14} />}>Edit</Button>
                  <Button variant="ghost" size="sm" leftIcon={<Icon name="Copy" size={14} />}>Duplicate</Button>
                </div>
              </Card>
            ))}
            <Card padding="lg" className={styles.addRoleCard} hover>
              <div className={styles.addRoleContent}>
                <span className={styles.addRoleIcon}>
                  <Icon name="Plus" size={28} />
                </span>
                <span className={styles.addRoleText}>Create New Role</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Permissions */}
      {activeTab === 'permissions' && (
        <div className={styles.section}>
          <Card padding="lg">
            <div className={styles.permsIntro}>
              <div>
                <h3 className={styles.permsTitle}>Permission Matrix</h3>
                <p className={styles.permsSubtitle}>Define what each role can access across modules</p>
              </div>
              <Button size="sm" leftIcon={<Icon name="Save" size={16} />}>Save Permissions</Button>
            </div>
            <div className={styles.permsMatrix}>
              {permissionGroups.map((group) => (
                <div key={group.module} className={styles.permGroup}>
                  <div className={styles.permGroupHeader}>
                    <span className={styles.permGroupIcon}>
                      <Icon name={group.icon} size={18} />
                    </span>
                    <span className={styles.permGroupName}>{group.module}</span>
                  </div>
                  <div className={styles.permItems}>
                    {group.permissions.map((perm) => (
                      <div key={perm.id} className={styles.permItem}>
                        <div className={styles.permItemInfo}>
                          <span className={styles.permItemLabel}>{perm.label}</span>
                          <span className={styles.permItemDesc}>{perm.description}</span>
                        </div>
                        <PermissionToggle permissionId={perm.id} roles={roles} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Activity Log */}
      {activeTab === 'activity' && (
        <ActivityLogSection logs={activityLogs} />
      )}
    </div>
  );
}

/* ---------- Permission toggle ---------- */
function PermissionToggle({
  permissionId,
  roles,
}: {
  permissionId: string;
  roles: typeof import('../../data/roles').roles;
}) {
  return (
    <div className={styles.permToggleRow}>
      {roles.map((role) => {
        const hasPermission = role.permissions[0] === 'all' || role.permissions.includes(permissionId);
        return (
          <div key={role.id} className={styles.permCheckbox} title={role.name}>
            <span className={styles.permCheckboxLabel}>{role.name}</span>
            <span className={`${styles.permCheck} ${hasPermission ? styles.permChecked : ''}`}>
              {hasPermission && <Icon name="Check" size={14} />}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Activity Log Section ---------- */
function ActivityLogSection({ logs }: { logs: ActivityLog[] }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const filtered = useMemo(() => {
    let data = [...logs];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((l) => l.userName.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q));
    }
    if (categoryFilter) data = data.filter((l) => l.category === categoryFilter);
    return data;
  }, [logs, search, categoryFilter]);

  return (
    <div className={styles.section}>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Input
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Icon name="Search" size={16} />}
            className={styles.searchInput}
          />
          <Select
            options={[
              { value: '', label: 'All Categories' },
              { value: 'auth', label: 'Authentication' },
              { value: 'sales', label: 'Sales' },
              { value: 'inventory', label: 'Inventory' },
              { value: 'customers', label: 'Customers' },
              { value: 'settings', label: 'Settings' },
              { value: 'documents', label: 'Documents' },
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.filterSelect}
          />
        </div>
      </div>

      <Card padding="none">
        <div className={styles.activityList}>
          {filtered.map((log) => (
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
                  <span className={styles.activityUser}>
                    <Avatar name={log.userName} size="sm" />
                    {log.userName}
                  </span>
                  <span className={styles.activityTime}>{log.timestamp}</span>
                  <span className={styles.activityIp}>IP: {log.ip}</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className={styles.emptyWrap}>
              <EmptyState icon="Activity" title="No activity found" message="No log entries match your search." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
