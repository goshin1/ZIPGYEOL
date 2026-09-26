import { BarChart3, ListFilter, type LucideIcon, Map as MapIcon } from 'lucide-react';
import type { MobileTab } from '@/types';

const TABS: { value: MobileTab; label: string; icon: LucideIcon }[] = [
    { value: 'map', label: '지도 보기', icon: MapIcon },
    { value: 'details', label: '지역 상세', icon: ListFilter },
    { value: 'compare', label: '비교 분석', icon: BarChart3 },
];

interface MobileTabBarProps {
    value: MobileTab;
    onChange: (tab: MobileTab) => void;
}

/** 모바일 전용 하단 탭 네비게이션 */
export default function MobileTabBar({ value, onChange }: MobileTabBarProps) {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-30 shadow-lg transition-colors">
            {TABS.map(({ value: tab, label, icon: Icon }) => (
                <button
                    key={tab}
                    type="button"
                    onClick={() => onChange(tab)}
                    aria-current={value === tab ? 'page' : undefined}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        value === tab ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </button>
            ))}
        </nav>
    );
}
