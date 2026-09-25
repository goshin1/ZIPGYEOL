import { type FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import { type GeocodeResult, searchAddress } from '@/lib/api/geocoding';
import type { SlotId } from '@/types';

interface SearchBarProps {
    activeSlotId: SlotId;
    onFound: (result: GeocodeResult) => void;
    onMessage: (message: string) => void;
}

export default function SearchBar({ activeSlotId, onFound, onMessage }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            onMessage('검색어를 입력해 주세요.');
            return;
        }

        setIsSearching(true);
        try {
            const result = await searchAddress(trimmed);
            if (result) {
                onFound(result);
                setQuery('');
            } else {
                onMessage('해당 지역 검색 결과가 없습니다. 올바른 시·군·구 명칭을 입력해 보세요.');
            }
        } catch (error) {
            onMessage(error instanceof Error ? error.message : '검색 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isSearching}
                    placeholder={`[${activeSlotId} 슬롯] 주소 검색 (예: 역삼동, 서울 강남구 역삼동 737)`}
                    className="w-full h-9 pl-9 pr-4 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
            </div>
        </form>
    );
}
