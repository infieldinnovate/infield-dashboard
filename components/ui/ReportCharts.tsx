'use client';

import React, { useState, useRef, useEffect } from 'react';
import Card from '../ui/Card';
import Icon from '../ui/Icon';
import type { TimeSeriesPoint, CategoryBreakdown } from '../../types';
import { formatCompactCurrency } from '../../lib/reportUtils';
import { formatCurrency } from '../../lib/documentUtils';
import styles from './ReportCharts.module.scss';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, icon, children, className = '' }: ChartCardProps) {
  return (
    <Card className={`${styles.chartCard} ${className}`} padding="lg">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {icon && <span className={styles.icon}><Icon name={icon} size={18} /></span>}
          <h3 className={styles.title}>{title}</h3>
        </div>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      <div className={styles.chartBody}>{children}</div>
    </Card>
  );
}

const CHART_COLORS = [
  'var(--primary-500)',
  'var(--secondary-500)',
  'var(--accent-500)',
  'var(--success-500)',
  'var(--warning-500)',
  'var(--error-500)',
];

// ─── Shared helpers ───────────────────────────────────────────────────────────

function useContainerWidth(ref: React.RefObject<HTMLDivElement>) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(ref.current);
    setWidth(ref.current.offsetWidth);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}

function niceMax(vals: number[]) {
  const max = Math.max(...vals, 0);
  if (max === 0) return 1;
  const exp = Math.floor(Math.log10(max));
  const base = Math.pow(10, exp);
  const step = Math.ceil(max / base) * base;
  return step || 1;
}

function yTicks(max: number, count = 5) {
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

interface TooltipState {
  x: number;
  y: number;
  label: string;
  value: number;
  visible: boolean;
}

function ChartTooltip({ state, formatter }: { state: TooltipState; formatter: (v: number) => string }) {
  if (!state.visible) return null;
  return (
    <div
      className={styles.tooltip}
      style={{ left: state.x, top: state.y }}
    >
      <div className={styles.tooltipLabel}>{state.label}</div>
      <div className={styles.tooltipValue}>{formatter(state.value)}</div>
    </div>
  );
}

// ─── AreaTrend ────────────────────────────────────────────────────────────────

interface AreaTrendProps {
  data: TimeSeriesPoint[];
  label?: string;
  height?: number;
}

export function AreaTrend({ data, label = 'Value', height = 280 }: AreaTrendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, label: '', value: 0, visible: false });

  const padL = 60, padR = 16, padT = 16, padB = 36;
  const chartW = Math.max(width - padL - padR, 0);
  const chartH = height - padT - padB;
  const values = data.map((d) => d.value);
  const maxVal = niceMax(values);
  const ticks = yTicks(maxVal);

  const px = (i: number) => padL + (chartW / Math.max(data.length - 1, 1)) * i;
  const py = (v: number) => padT + chartH - (v / maxVal) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.value)}`).join(' ');
  const areaPath = data.length
    ? `${linePath} L${px(data.length - 1)},${padT + chartH} L${px(0)},${padT + chartH} Z`
    : '';

  return (
    <div ref={containerRef} className={styles.svgWrap} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + chartW} y1={py(t)} y2={py(t)} stroke="var(--neutral-200)" strokeDasharray="3 3" />
              <text x={padL - 6} y={py(t) + 4} textAnchor="end" fontSize={11} fill="var(--neutral-500)">
                {formatCompactCurrency(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={px(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--neutral-500)">
              {d.label}
            </text>
          ))}
          {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}
          {linePath && <path d={linePath} fill="none" stroke="var(--primary-500)" strokeWidth={2} strokeLinejoin="round" />}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={px(i)}
              cy={py(d.value)}
              r={4}
              fill="var(--primary-500)"
              className={styles.dot}
              onMouseEnter={() => setTooltip({ x: px(i), y: py(d.value) - 10, label: d.label, value: d.value, visible: true })}
              onMouseLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
            />
          ))}
        </svg>
      )}
      <ChartTooltip state={tooltip} formatter={(v) => `${label}: ${formatCurrency(v)}`} />
    </div>
  );
}

// ─── BarTrend ─────────────────────────────────────────────────────────────────

interface BarTrendProps {
  data: TimeSeriesPoint[];
  label?: string;
  height?: number;
  colorIndex?: number;
}

export function BarTrend({ data, label = 'Value', height = 280, colorIndex = 0 }: BarTrendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, label: '', value: 0, visible: false });
  const color = CHART_COLORS[colorIndex % CHART_COLORS.length];

  const padL = 60, padR = 16, padT = 16, padB = 36;
  const chartW = Math.max(width - padL - padR, 0);
  const chartH = height - padT - padB;
  const values = data.map((d) => d.value);
  const maxVal = niceMax(values);
  const ticks = yTicks(maxVal);

  const barW = Math.min(32, (chartW / Math.max(data.length, 1)) * 0.6);
  const slotW = chartW / Math.max(data.length, 1);
  const barX = (i: number) => padL + slotW * i + (slotW - barW) / 2;
  const barH = (v: number) => (v / maxVal) * chartH;
  const barY = (v: number) => padT + chartH - barH(v);

  return (
    <div ref={containerRef} className={styles.svgWrap} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + chartW} y1={padT + chartH - (t / maxVal) * chartH} y2={padT + chartH - (t / maxVal) * chartH} stroke="var(--neutral-200)" strokeDasharray="3 3" />
              <text x={padL - 6} y={padT + chartH - (t / maxVal) * chartH + 4} textAnchor="end" fontSize={11} fill="var(--neutral-500)">
                {formatCompactCurrency(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={barX(i) + barW / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--neutral-500)">
              {d.label}
            </text>
          ))}
          {data.map((d, i) => (
            <rect
              key={i}
              x={barX(i)}
              y={barY(d.value)}
              width={barW}
              height={barH(d.value)}
              fill={color}
              rx={4}
              className={styles.bar}
              onMouseEnter={() => setTooltip({ x: barX(i) + barW / 2, y: barY(d.value) - 10, label: d.label, value: d.value, visible: true })}
              onMouseLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
            />
          ))}
        </svg>
      )}
      <ChartTooltip state={tooltip} formatter={(v) => `${label}: ${formatCurrency(v)}`} />
    </div>
  );
}

// ─── DualBarTrend ─────────────────────────────────────────────────────────────

interface DualBarTrendProps {
  data: { month: string; revenue: number; profit: number }[];
  height?: number;
}

export function DualBarTrend({ data, height = 280 }: DualBarTrendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; revenue: number; profit: number; visible: boolean }>({ x: 0, y: 0, label: '', revenue: 0, profit: 0, visible: false });

  const padL = 60, padR = 16, padT = 16, padB = 50;
  const chartW = Math.max(width - padL - padR, 0);
  const chartH = height - padT - padB;
  const maxVal = niceMax(data.flatMap((d) => [d.revenue, d.profit]));
  const ticks = yTicks(maxVal);

  const slotW = chartW / Math.max(data.length, 1);
  const pairW = Math.min(44, slotW * 0.7);
  const barW = pairW / 2 - 2;
  const slotX = (i: number) => padL + slotW * i + (slotW - pairW) / 2;
  const bh = (v: number) => (v / maxVal) * chartH;
  const by = (v: number) => padT + chartH - bh(v);

  return (
    <div ref={containerRef} className={styles.svgWrap} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + chartW} y1={padT + chartH - (t / maxVal) * chartH} y2={padT + chartH - (t / maxVal) * chartH} stroke="var(--neutral-200)" strokeDasharray="3 3" />
              <text x={padL - 6} y={padT + chartH - (t / maxVal) * chartH + 4} textAnchor="end" fontSize={11} fill="var(--neutral-500)">
                {formatCompactCurrency(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={slotX(i) + pairW / 2} y={height - padB + 18} textAnchor="middle" fontSize={11} fill="var(--neutral-500)">
              {d.month}
            </text>
          ))}
          {data.map((d, i) => (
            <g key={i}
              onMouseEnter={() => setTooltip({ x: slotX(i) + pairW / 2, y: by(Math.max(d.revenue, d.profit)) - 10, label: d.month, revenue: d.revenue, profit: d.profit, visible: true })}
              onMouseLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
            >
              <rect x={slotX(i)} y={by(d.revenue)} width={barW} height={bh(d.revenue)} fill="var(--primary-500)" rx={3} className={styles.bar} />
              <rect x={slotX(i) + barW + 4} y={by(d.profit)} width={barW} height={bh(d.profit)} fill="var(--success-500)" rx={3} className={styles.bar} />
            </g>
          ))}
          {/* Legend */}
          <circle cx={padL} cy={height - 14} r={5} fill="var(--primary-500)" />
          <text x={padL + 10} y={height - 10} fontSize={12} fill="var(--neutral-600)">Revenue</text>
          <circle cx={padL + 80} cy={height - 14} r={5} fill="var(--success-500)" />
          <text x={padL + 90} y={height - 10} fontSize={12} fill="var(--neutral-600)">Profit</text>
        </svg>
      )}
      {tooltip.visible && (
        <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <div className={styles.tooltipLabel}>{tooltip.label}</div>
          <div className={styles.tooltipValue}>Revenue: {formatCurrency(tooltip.revenue)}</div>
          <div className={styles.tooltipValue}>Profit: {formatCurrency(tooltip.profit)}</div>
        </div>
      )}
    </div>
  );
}

// ─── LineTrend ────────────────────────────────────────────────────────────────

interface LineTrendProps {
  data: TimeSeriesPoint[];
  label?: string;
  height?: number;
}

export function LineTrend({ data, label = 'Value', height = 280 }: LineTrendProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, label: '', value: 0, visible: false });

  const padL = 60, padR = 16, padT = 16, padB = 36;
  const chartW = Math.max(width - padL - padR, 0);
  const chartH = height - padT - padB;
  const values = data.map((d) => d.value);
  const maxVal = niceMax(values);
  const ticks = yTicks(maxVal);

  const px = (i: number) => padL + (chartW / Math.max(data.length - 1, 1)) * i;
  const py = (v: number) => padT + chartH - (v / maxVal) * chartH;
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${px(i)},${py(d.value)}`).join(' ');

  return (
    <div ref={containerRef} className={styles.svgWrap} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={padL + chartW} y1={py(t)} y2={py(t)} stroke="var(--neutral-200)" strokeDasharray="3 3" />
              <text x={padL - 6} y={py(t) + 4} textAnchor="end" fontSize={11} fill="var(--neutral-500)">
                {formatCompactCurrency(t)}
              </text>
            </g>
          ))}
          {data.map((d, i) => (
            <text key={i} x={px(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--neutral-500)">
              {d.label}
            </text>
          ))}
          {linePath && <path d={linePath} fill="none" stroke="var(--secondary-500)" strokeWidth={2} strokeLinejoin="round" />}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={px(i)}
              cy={py(d.value)}
              r={4}
              fill="var(--secondary-500)"
              className={styles.dot}
              onMouseEnter={() => setTooltip({ x: px(i), y: py(d.value) - 10, label: d.label, value: d.value, visible: true })}
              onMouseLeave={() => setTooltip((p) => ({ ...p, visible: false }))}
            />
          ))}
        </svg>
      )}
      <ChartTooltip state={tooltip} formatter={(v) => `${label}: ${formatCurrency(v)}`} />
    </div>
  );
}

// ─── CategoryPie ──────────────────────────────────────────────────────────────

interface CategoryPieProps {
  data: CategoryBreakdown[];
  height?: number;
}

export function CategoryPie({ data, height = 280 }: CategoryPieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = useContainerWidth(containerRef);
  const [hovered, setHovered] = useState<number | null>(null);

  const legendH = Math.ceil(data.length / 2) * 22 + 8;
  const chartH = height - legendH;
  const cx = width / 2;
  const cy = chartH / 2;
  const outerR = Math.min(cx, cy) * 0.82;
  const innerR = outerR * 0.55;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  type Slice = { path: string; color: string; midX: number; midY: number; index: number };
  const slices: Slice[] = [];
  let angle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const a1 = angle;
    const a2 = angle + sweep;
    const lx1 = cx + outerR * Math.cos(a1);
    const ly1 = cy + outerR * Math.sin(a1);
    const lx2 = cx + outerR * Math.cos(a2);
    const ly2 = cy + outerR * Math.sin(a2);
    const sx1 = cx + innerR * Math.cos(a2);
    const sy1 = cy + innerR * Math.sin(a2);
    const sx2 = cx + innerR * Math.cos(a1);
    const sy2 = cy + innerR * Math.sin(a1);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M${lx1},${ly1} A${outerR},${outerR} 0 ${large} 1 ${lx2},${ly2} L${sx1},${sy1} A${innerR},${innerR} 0 ${large} 0 ${sx2},${sy2} Z`;
    const mid = a1 + sweep / 2;
    slices.push({ path, color: CHART_COLORS[i % CHART_COLORS.length], midX: cx + (outerR + 12) * Math.cos(mid), midY: cy + (outerR + 12) * Math.sin(mid), index: i });
    angle = a2;
  });

  return (
    <div ref={containerRef} className={styles.svgWrap} style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className={styles.svg}>
          {slices.map((s) => (
            <path
              key={s.index}
              d={s.path}
              fill={s.color}
              opacity={hovered === null || hovered === s.index ? 1 : 0.5}
              className={styles.slice}
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Center label when hovered */}
          {hovered !== null && data[hovered] && (
            <>
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize={12} fill="var(--neutral-500)">{data[hovered].category}</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--neutral-900)">{formatCurrency(data[hovered].value)}</text>
            </>
          )}
          {/* Legend */}
          {data.map((d, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const lx = col === 0 ? 8 : width / 2 + 8;
            const ly = chartH + 14 + row * 22;
            return (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                <rect x={lx} y={ly - 8} width={10} height={10} rx={2} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                <text x={lx + 14} y={ly} fontSize={11} fill="var(--neutral-600)">{d.category}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
