'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './GlobalSearch.module.scss';
import Icon from '../ui/Icon';
import { search, searchByCategory, highlightMatch, type SearchResult } from '../../lib/search';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryOrder: { id: string; label: string; icon: string }[] = [
  { id: 'products', label: 'Products', icon: 'Package' },
  { id: 'customers', label: 'Customers', icon: 'Users' },
  { id: 'invoices', label: 'Invoices', icon: 'FileSpreadsheet' },
  { id: 'receipts', label: 'Receipts', icon: 'Receipt' },
  { id: 'quotations', label: 'Quotations', icon: 'FileText' },
  { id: 'delivery-notes', label: 'Delivery Notes', icon: 'PackageCheck' },
];

const categoryIconMap: Record<string, string> = {
  products: 'Package',
  customers: 'Users',
  invoices: 'FileSpreadsheet',
  receipts: 'Receipt',
  quotations: 'FileText',
  'delivery-notes': 'PackageCheck',
};

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [useGrouped, setUseGrouped] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setUseGrouped(true);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    return useGrouped ? searchByCategory(query, 4) : search(query, 20);
  }, [query, useGrouped]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault();
        router.push(results[activeIndex].href);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, results, activeIndex, router, onClose]);

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const scrollToActive = useCallback((index: number) => {
    const container = resultsRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-index="${index}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  useEffect(() => {
    scrollToActive(activeIndex);
  }, [activeIndex, scrollToActive]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <span className={styles.searchIcon}>
            <Icon name="Search" size={20} />
          </span>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search products, customers, invoices, and more..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className={styles.kbd}>ESC</kbd>
        </div>

        {results.length > 0 && (
          <div className={styles.toolbar}>
            <span className={styles.resultCount}>
              {results.length} result{results.length !== 1 ? 's' : ''}
            </span>
            <button
              className={`${styles.viewBtn} ${useGrouped ? styles.viewActive : ''}`}
              onClick={() => setUseGrouped(true)}
            >
              Grouped
            </button>
            <button
              className={`${styles.viewBtn} ${!useGrouped ? styles.viewActive : ''}`}
              onClick={() => setUseGrouped(false)}
            >
              All
            </button>
          </div>
        )}

        <div className={styles.resultsContainer} ref={resultsRef}>
          {query.trim() === '' ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="Search" size={32} />
              </div>
              <p className={styles.emptyTitle}>Start typing to search</p>
              <p className={styles.emptySubtitle}>
                Search across products, customers, invoices, receipts, quotations, and delivery notes
              </p>
              <div className={styles.hintRow}>
                <kbd className={styles.hintKbd}>↑</kbd>
                <kbd className={styles.hintKbd}>↓</kbd>
                <span>navigate</span>
                <kbd className={styles.hintKbd}>↵</kbd>
                <span>open</span>
                <kbd className={styles.hintKbd}>esc</kbd>
                <span>close</span>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icon name="SearchX" size={32} />
              </div>
              <p className={styles.emptyTitle}>No results found</p>
              <p className={styles.emptySubtitle}>
                Try a different search term for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : useGrouped ? (
            <GroupedResults
              results={results}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              onHover={setActiveIndex}
            />
          ) : (
            <FlatResults
              results={results}
              activeIndex={activeIndex}
              onSelect={handleSelect}
              onHover={setActiveIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ResultListProps {
  results: SearchResult[];
  activeIndex: number;
  onSelect: (href: string) => void;
  onHover: (index: number) => void;
}

function HighlightedText({
  text,
  matches,
  fieldKey,
}: {
  text: string;
  matches: SearchResult['matches'];
  fieldKey: string;
}) {
  const parts = highlightMatch(text, matches, fieldKey);
  return (
    <>
      {parts.map((part, i) => {
        if (React.isValidElement(part)) {
          return (
            <mark key={i} className={styles.highlight}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function GroupedResults({ results, activeIndex, onSelect, onHover }: ResultListProps) {
  let globalIndex = 0;
  const grouped = useMemo(() => {
    const map: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    }
    return map;
  }, [results]);

  return (
    <div className={styles.groupedList}>
      {categoryOrder.map((cat) => {
        const items = grouped[cat.id];
        if (!items || items.length === 0) return null;
        return (
          <div key={cat.id} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupIcon}>
                <Icon name={cat.icon} size={14} />
              </span>
              <span className={styles.groupLabel}>{cat.label}</span>
              <span className={styles.groupCount}>{items.length}</span>
            </div>
            {items.map((r) => {
              const idx = globalIndex++;
              return (
                <ResultRow
                  key={r.id}
                  result={r}
                  index={idx}
                  isActive={idx === activeIndex}
                  onSelect={onSelect}
                  onHover={onHover}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function FlatResults({ results, activeIndex, onSelect, onHover }: ResultListProps) {
  return (
    <div className={styles.flatList}>
      {results.map((r, idx) => (
        <ResultRow
          key={r.id}
          result={r}
          index={idx}
          isActive={idx === activeIndex}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </div>
  );
}

function ResultRow({
  result,
  index,
  isActive,
  onSelect,
  onHover,
}: {
  result: SearchResult;
  index: number;
  isActive: boolean;
  onSelect: (href: string) => void;
  onHover: (index: number) => void;
}) {
  const icon = categoryIconMap[result.category] || 'File';
  return (
    <div
      data-index={index}
      className={`${styles.resultRow} ${isActive ? styles.resultActive : ''}`}
      onClick={() => onSelect(result.href)}
      onMouseMove={() => onHover(index)}
    >
      <span className={styles.resultIcon}>
        <Icon name={icon} size={18} />
      </span>
      <div className={styles.resultContent}>
        <span className={styles.resultTitle}>
          <HighlightedText text={result.title} matches={result.matches} fieldKey="title" />
        </span>
        <span className={styles.resultSubtitle}>
          <HighlightedText text={result.subtitle} matches={result.matches} fieldKey="subtitle" />
        </span>
      </div>
      <span className={styles.resultMeta}>
        <HighlightedText text={result.meta} matches={result.matches} fieldKey="meta" />
      </span>
    </div>
  );
}
