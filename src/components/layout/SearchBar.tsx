import { type KeyboardEvent, useEffect, useId, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useRegionSearch } from '@/hooks/useRegionSearch';
import { type GeocodeResult, searchAddress } from '@/lib/api/geocoding';
import { cn } from '@/lib/cn';
import { REGION_LEVEL_LABELS, regionLevel, regionName, regionParentLabel } from '@/lib/regionSearch';
import type { RegionEntry, SlotId } from '@/types';

interface SearchBarProps {
    activeSlotId: SlotId;
    /** 주소 검색(geocoder) 성공 */
    onFound: (result: GeocodeResult) => void | Promise<void>;
    /** 지역 후보 선택 */
    onRegionSelect: (entry: RegionEntry) => void;
    onMessage: (message: string) => void;
}

/** 드롭다운 맨 위 '주소로 검색하기' 행의 인덱스 (후보는 0부터) */
const SEARCH_ROW = -1;

const rowClass = (active: boolean) =>
    cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer text-xs',
        active ? 'bg-blue-50 dark:bg-blue-950/60' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60',
    );

export default function SearchBar({ activeSlotId, onFound, onRegionSelect, onMessage }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    // 지역 목록은 검색창을 처음 쓸 때 받는다 (첫 화면 로딩에 넣지 않기 위함)
    const [regionListRequested, setRegionListRequested] = useState(false);
    const {
        data: searchRegions,
        error: regionListError,
        loading: regionListLoading,
    } = useRegionSearch(regionListRequested);
    const listboxId = useId();

    const trimmed = query.trim();
    const suggestions = useMemo(
        () => (searchRegions && trimmed ? searchRegions(trimmed) : []),
        [searchRegions, trimmed],
    );
    // 후보가 줄어도 인덱스가 범위를 벗어나지 않도록 렌더링 시점에 보정한다
    const current = suggestions.length === 0 ? SEARCH_ROW : Math.min(activeIndex, suggestions.length - 1);
    const showDropdown = isOpen && trimmed.length > 0;
    const optionId = (index: number) => `${listboxId}-option-${index === SEARCH_ROW ? 'search' : index}`;
    const activeOptionId = showDropdown ? optionId(current) : undefined;

    // 키보드로 이동한 행이 스크롤 밖에 있으면 보이게 한다
    useEffect(() => {
        if (activeOptionId) document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
    }, [activeOptionId]);

    const close = () => setIsOpen(false);

    const selectRegion = (entry: RegionEntry) => {
        onRegionSelect(entry);
        setQuery('');
        close();
    };

    // 건물명, 도로명 주소 등 목록에 없는 검색어는 기존처럼 geocoder로 보낸다
    const searchByAddress = async () => {
        if (!trimmed) {
            onMessage('검색어를 입력해 주세요.');
            return;
        }

        close();
        setIsSearching(true);
        try {
            const result = await searchAddress(trimmed);
            if (result) {
                // 경계 조회까지 끝나야 슬롯이 바뀌므로 그동안 입력창을 막아 둔다
                await onFound(result);
                setQuery('');
            } else {
                onMessage('주소 검색 결과가 없습니다. 지역명이나 도로명 주소를 입력해 보세요.');
            }
        } catch (error) {
            onMessage(error instanceof Error ? error.message : '검색 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        // 한글 조합 중 Enter/방향키는 조합 확정용이다. 무시하지 않으면 Enter가 두 번 처리된다
        if (event.nativeEvent.isComposing) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex(Math.min(current + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActiveIndex(Math.max(current - 1, SEARCH_ROW));
                break;
            case 'Enter':
                event.preventDefault();
                if (current === SEARCH_ROW) void searchByAddress();
                else selectRegion(suggestions[current]);
                break;
            case 'Escape':
                close();
                break;
        }
    };

    const statusMessage = regionListLoading
        ? '지역 목록을 불러오는 중입니다...'
        : regionListError
          ? '지역 목록을 불러오지 못했습니다. 주소 검색은 사용할 수 있습니다.'
          : searchRegions && suggestions.length === 0
            ? '일치하는 지역이 없습니다.'
            : null;

    return (
        <div className="relative flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                    type="text"
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeOptionId}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        setRegionListRequested(true);
                        setIsOpen(true);
                    }}
                    onBlur={close}
                    onKeyDown={handleKeyDown}
                    disabled={isSearching}
                    placeholder={`[${activeSlotId} 슬롯] 지역명 또는 주소 검색 (예: 역삼동, 수원 장안구)`}
                    className="w-full h-9 pl-9 pr-4 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:opacity-60"
                />
            </div>

            {showDropdown && (
                <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="지역 검색 결과"
                    // 항목을 누를 때 input의 blur가 먼저 일어나 목록이 닫히지 않도록 포커스 이동을 막는다
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute top-full inset-x-0 mt-1.5 z-30 max-h-80 overflow-y-auto p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl"
                >
                    {/* 주소로 검색하기: 목록 맨 위에 고정 */}
                    <li
                        id={optionId(SEARCH_ROW)}
                        role="option"
                        aria-selected={current === SEARCH_ROW}
                        onMouseEnter={() => setActiveIndex(SEARCH_ROW)}
                        onClick={() => void searchByAddress()}
                        // 스크롤되는 후보가 비쳐 보이지 않도록 고정 행은 불투명 배경을 쓴다
                        className={cn(
                            rowClass(current === SEARCH_ROW),
                            'sticky top-0 z-10 mb-1 border-b border-slate-100 dark:border-slate-800',
                            current === SEARCH_ROW ? 'dark:bg-blue-950' : 'bg-white dark:bg-slate-900',
                        )}
                    >
                        <Search className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">
                            <span className="font-bold">&lsquo;{trimmed}&rsquo;</span> 주소로 검색하기
                        </span>
                    </li>

                    {statusMessage && (
                        <li role="presentation" className="px-3 py-2 text-[11px] text-slate-400">
                            {statusMessage}
                        </li>
                    )}

                    {suggestions.map((entry, index) => {
                        const parent = regionParentLabel(entry);
                        return (
                            <li
                                key={entry.code}
                                id={optionId(index)}
                                role="option"
                                aria-selected={current === index}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => selectRegion(entry)}
                                className={rowClass(current === index)}
                            >
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                <span className="flex-1 min-w-0 truncate">
                                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                                        {regionName(entry)}
                                    </span>
                                    {parent && <span className="ml-1.5 text-slate-400">{parent}</span>}
                                </span>
                                <span className="shrink-0 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    {REGION_LEVEL_LABELS[regionLevel(entry)]}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
