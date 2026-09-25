import type { CSSProperties } from 'react';

// Recharts 공통 스타일. 색상 변수(--tooltip-*)는 globals.css에서 라이트/다크별로 정의.

export const TOOLTIP_STYLE: CSSProperties = {
    backgroundColor: 'var(--tooltip-bg)',
    borderRadius: '8px',
    borderColor: 'var(--tooltip-border)',
    color: 'var(--tooltip-text)',
    fontSize: '11px',
};

export const AXIS_TICK = { fill: '#94a3b8', fontSize: 10 };

export const CHART_PRIMARY = '#2563eb';
