'use client';

import React, { useState } from 'react';
import Icon from './Icon';
import styles from './Tabs.module.scss';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills';
}

export default function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledTab,
  onChange,
  variant = 'default',
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id);
  const activeTab = controlledTab ?? internalTab;

  const handleClick = (tabId: string) => {
    if (controlledTab === undefined) setInternalTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  if (tabs.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.tabList} ${styles[variant]}`} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => handleClick(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.icon && (
              <span className={styles.tabIcon}>
                <Icon name={tab.icon} size={18} />
              </span>
            )}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.panel} role="tabpanel">{activeContent}</div>
    </div>
  );
}
