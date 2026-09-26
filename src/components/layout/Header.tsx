import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { GeocodeResult } from '@/lib/api/geocoding';
import type { SlotId } from '@/types';
import SearchBar from './SearchBar';

interface HeaderProps {
    activeSlotId: SlotId;
    onFound: (result: GeocodeResult) => void;
    onMessage: (message: string) => void;
}

export default function Header({ activeSlotId, onFound, onMessage }: HeaderProps) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="w-full h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
            <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base sm:text-lg shrink-0">
                ZIPGyeol
            </span>

            <SearchBar activeSlotId={activeSlotId} onFound={onFound} onMessage={onMessage} />

            <button
                type="button"
                onClick={toggleTheme}
                aria-label="테마 변경"
                className="p-2 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
        </header>
    );
}
