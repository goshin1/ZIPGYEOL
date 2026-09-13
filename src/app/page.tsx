// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Search, Map as MapIcon, ListFilter, BarChart3, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import AnalysisPanel from "@/components/analytics/AnalysisPanel";
import { FacilityItem } from "@/lib/calculator";
import RegionDetailSection from "@/components/dashboard/RegionDetailSection";

export interface RegionSlot {
    id: 'A' | 'B' | 'C'; // 지역 선택은 3개를 기본으로
    name: string;
    lat: number;
    lng: number;
    color: string;
}

const VWorldMap = dynamic(() => import('@/components/map/VWorldMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
            공간 지도를 로딩 중입니다...
        </div>
    ),
});

export default function Home() {
    // 모바일 전용 탭 상태 ('map' | 'details' | 'compare')
    const [mobileTab, setMobileTab] = useState<'map' | 'details' | 'compare'>('map');
    // 검색 관련 상태
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    // 라이트/다크 스위치
    const [isDark, setIsDark] = useState(false);

    // Toast 메시지 상태 관리
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // A/B/C 비교 슬롯 전역 상태
    const [slots, setSlots] = useState<RegionSlot[]>([
        { id: 'A', name: '강남구', lat: 37.5172, lng: 127.0473, color: '#2563eb' },
        { id: 'B', name: '마포구', lat: 37.5663, lng: 126.9014, color: '#9333ea' },
        { id: 'C', name: '송파구', lat: 37.5145, lng: 127.1059, color: '#10b981' },
    ]);

    // 슬롯별 독립적인 주변 시설 목록 관리 ({ A: [], B: [], C: [] })
    const [slotFacilities, setSlotFacilities] = useState<Record<'A' | 'B' | 'C', FacilityItem[]>>({
        A: [],
        B: [],
        C: [],
    });

    // 현재 지도 이동 대상 슬롯
    const [activeSlot, setActiveSlot] = useState<RegionSlot>(slots[0]);

    // 토스트 출력 함수
    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // VWorldMap 콜백: (slotId, data)를 전달받아 해당 슬롯 상태 독립 갱신
    const handleFacilitiesFetched = (slotId: 'A' | 'B' | 'C', data: FacilityItem[]) => {
        setSlotFacilities((prev) => ({
            ...prev,
            [slotId]: data,
        }));
    };

    // Geocoding 검색 API 호출 및 활성화 된 슬롯 갱신
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            showToast('검색어를 입력해 주세요.');
            return;
        }

        setIsSearching(true);
        const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

        try {
            const response = await fetch(
                `/geocoding?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(
                    searchQuery
                )}&type=ADDRESS&category=PARCEL&format=json&errorformat=json&key=${apiKey}`
            );

            const data = await response.json();

            if (data.response?.status === 'ERROR') {
                showToast(`API 오류: ${data.response.error?.text || '검색 실패'}`);
                setIsSearching(false);
                return;
            }

            const result = data.response?.result?.items?.[0];

            if (result && result.point) {
                const newLng = parseFloat(result.point.x);
                const newLat = parseFloat(result.point.y);

                const addressObj = result.address || {};
                const fullAddress = addressObj.parcel || addressObj.road || result.title || searchQuery;

                const extractRegionName = (addr: string) => {
                    const tokens = addr.split(' ');
                    let cityOrCounty = '';

                    for (const token of tokens) {
                        if (token.endsWith('시') || token.endsWith('군')) {
                            cityOrCounty = token;
                            break;
                        }
                    }
                    return cityOrCounty || searchQuery;
                };

                const regionName = extractRegionName(fullAddress);

                const updatedSlot: RegionSlot = {
                    ...activeSlot,
                    name: regionName,
                    lat: newLat,
                    lng: newLng,
                };

                setSlots((prev) => prev.map((s) => (s.id === activeSlot.id ? updatedSlot : s)));
                setActiveSlot(updatedSlot);
                setSearchQuery('');
                showToast(`[${activeSlot.id} 슬롯] '${regionName}'(으)로 설정되었습니다.`);
            } else {
                showToast('해당 지역 검색 결과가 없습니다. 올바른 시·군·구 명칭을 입력해 보세요.');
            }
        } catch (error) {
            console.error('VWorld Geocoding API Error:', error);
            showToast('검색 처리 중 오류가 발생했습니다.');
        } finally {
            setIsSearching(false);
        }
    };

    // 선택한 지역 이동
    const handleSelectSlot = (slot: RegionSlot) => {
        setActiveSlot(slot);
        if (mobileTab === 'compare') setMobileTab('map');
    };

    // 테마 변경 함수
    const toggleDarkMode = () => {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDark(false);
        } else {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDark(true);
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
            {/* Toast 알림 팝업 */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* 1. 상단 네비게이션 헤더 */}
            <header className="w-full h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between shrink-0 z-20">
                {/* 로고 영역 */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 text-base sm:text-lg">ZIPGyeol</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-md font-semibold">Beta</span>
                </div>

                {/* 💡 검색바 영역 (복원됨) */}
                <form onSubmit={handleSearch} className="flex-1 max-w-md mx-2 sm:mx-4">
                    <div className="relative flex items-center">
                        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`[${activeSlot.id} 슬롯] 장소/주소 검색 (예: 강남역, 역삼동)`}
                            className="w-full h-9 pl-9 pr-4 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                </form>

                {/* 우측 유틸리티 영역 (테마 스위치) */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={toggleDarkMode}
                        aria-label="테마 변경"
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* 2. 메인 뷰포트 */}
            <div className="flex flex-1 overflow-hidden relative pb-14 md:pb-0">

                {/* [좌측/중앙] 지도 및 상세 정보 패널 */}
                <div className={`flex-1 flex-col min-w-0 ${mobileTab === 'compare' ? 'hidden md:flex' : 'flex'}`}>

                    {/* 지도 영역 */}
                    <div className={`relative flex-1 ${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
                        <VWorldMap
                            activeSlot={activeSlot}
                            slots={slots}
                            onSelectSlot={handleSelectSlot}
                            onFacilitiesFetched={handleFacilitiesFetched}
                        />

                        {/* 모바일 화면 - 선택 지역 동적 슬롯 오버레이 카드 */}
                        <div className="md:hidden absolute bottom-4 left-4 right-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">선택 지역 비교</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">3개 선택됨</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
                                {slots.map((s) => (
                                    <div
                                        key={s.id}
                                        className="p-1.5 rounded-lg truncate"
                                        style={{
                                            backgroundColor: `${s.color}15`,
                                            color: s.color,
                                        }}
                                    >
                                        {s.id} {s.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 하단 상세 정보 패널 */}
                    <RegionDetailSection
                        activeSlotName={activeSlot.name}
                        facilities={slotFacilities[activeSlot.id] || []}
                        mobileTab={mobileTab}
                    />
                </div>

                {/* [우측] 비교 분석 패널 */}
                <aside className={`${mobileTab === 'compare' ? 'flex flex-1 w-full' : 'hidden md:block md:w-[380px]'} shrink-0 h-full overflow-hidden bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors`}>
                    <AnalysisPanel
                        slotFacilities={slotFacilities}
                        slots={slots}
                        activeSlot={activeSlot}
                        onSelectSlot={handleSelectSlot}
                    />
                </aside>

            </div>

            {/* 3. 모바일 전용 하단 탭 네비게이션 바 */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-30 shadow-lg transition-colors">
                <button
                    onClick={() => setMobileTab('map')}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        mobileTab === 'map' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    <MapIcon className="w-5 h-5" />
                    <span>지도 보기</span>
                </button>
                <button
                    onClick={() => setMobileTab('details')}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        mobileTab === 'details' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    <ListFilter className="w-5 h-5" />
                    <span>지역 상세</span>
                </button>
                <button
                    onClick={() => setMobileTab('compare')}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        mobileTab === 'compare' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                >
                    <BarChart3 className="w-5 h-5" />
                    <span>비교 분석</span>
                </button>
            </nav>
        </div>
    );
}