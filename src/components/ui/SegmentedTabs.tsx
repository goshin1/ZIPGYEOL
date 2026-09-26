import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
    value: T;
    label: string;
    icon?: LucideIcon;
}

interface SegmentedTabsProps<T extends string> {
    items: readonly TabItem<T>[];
    value: T;
    onChange: (value: T) => void;
    /**
     * - segmented: 회색 트랙 안에서 선택된 탭만 흰 배경 (서브뷰 전환용)
     * - solid: 테두리 버튼, 선택 시 진한 배경 (필터/차트 전환용)
     */
    variant?: 'segmented' | 'solid';
    size?: 'sm' | 'md';
    /** 탭들이 가로 폭을 균등하게 채울지 여부 */
    stretch?: boolean;
    className?: string;
}

const VARIANT_STYLES = {
    segmented: {
        track: 'bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700',
        active: 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm',
        inactive: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
        button: '',
    },
    solid: {
        track: '',
        active: 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500 shadow-sm',
        inactive:
            'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700',
        button: 'border',
    },
} as const;

const SIZE_STYLES = {
    sm: 'px-2 py-0.5 text-[11px] rounded-md',
    md: 'px-2.5 py-1.5 text-xs rounded-lg',
} as const;

export default function SegmentedTabs<T extends string>({
    items,
    value,
    onChange,
    variant = 'segmented',
    size = 'md',
    stretch = false,
    className,
}: SegmentedTabsProps<T>) {
    const styles = VARIANT_STYLES[variant];

    return (
        <div role="tablist" className={cn('flex flex-wrap items-center gap-1.5', styles.track, className)}>
            {items.map(({ value: itemValue, label, icon: Icon }) => {
                const isActive = itemValue === value;
                return (
                    <button
                        key={itemValue}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(itemValue)}
                        className={cn(
                            'font-semibold transition-all flex items-center justify-center gap-1',
                            SIZE_STYLES[size],
                            styles.button,
                            stretch && 'flex-1',
                            isActive ? styles.active : styles.inactive,
                        )}
                    >
                        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
