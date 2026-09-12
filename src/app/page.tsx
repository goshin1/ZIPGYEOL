'use client';

import {useState} from 'react';
import dynamic from 'next/dynamic';
import {
    Search,
    Bell,
    User,
    Map as MapIcon,
    ListFilter,
    BarChart3,
    Building2,
    Trees,
    Landmark,
    School,
    Train,
    Store,
    Hospital
} from 'lucide-react';
import AnalysisPanel from "@/components/analytics/AnalysisPanel";
import {FacilityItem} from "@/lib/calculator";
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
        <div
            className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
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

    // A/B/C 비교 슬롯 전역 상태
    const [slots, setSlots] = useState<RegionSlot[]>([
        {id: 'A', name: '서울역', lat: 37.5561, lng: 126.9723, color: '#2563eb'},
        {id: 'B', name: '명동역', lat: 37.5609, lng: 126.9863, color: '#9333ea'},
        {id: 'C', name: '가평 참전비공원', lat: 37.8257, lng: 127.5163, color: '#10b981'},
    ]);

    // 조회된 시설 정보
    const [facilities, setFacilities] = useState<FacilityItem[]>([]);

    // 현재 지도 이동 대상 슬롯
    const [activeSlot, setActiveSlot] = useState<RegionSlot>(slots[0]);

    // Geocoding 검색 API 호출 및 활성화 된 슬롯 갱신
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!searchQuery.trim()) return;

        setIsSearching(true);
        const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

        try{
            // VWorld 장소(PLACE) 및 주소(ADDRESS) 검색 REST API
            const response = await fetch(
                `/geocoding?service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&query=${encodeURIComponent(
                    searchQuery
                )}&type=PLACE&format=json&errorformat=json&key=${apiKey}`
            );

            const data = await response.json();
            const result = data.response?.result?.items?.[0];

            if (result && result.point) {
                const newLng = parseFloat(result.point.x);
                const newLat = parseFloat(result.point.y);
                const placeName = result.title || searchQuery;

                // 현재 활성화된 슬롯의 정보 업데이트
                const updatedSlot: RegionSlot = {
                    ...activeSlot,
                    name: placeName,
                    lat: newLat,
                    lng: newLng,
                };

                setSlots((prev) => prev.map((s) => (s.id === activeSlot.id ? updatedSlot : s)));
                setActiveSlot(updatedSlot);
                setSearchQuery('');
            }
        }catch (error){
            console.error('VWorld Geocoding API Error:', error);
            alert('검색 중 오류가 발생했습니다.');
        }finally {
            // 성공 여부 상관 없이 요청이 끝나면 검색 상태 확인 해제
            setIsSearching(false);
        }

    }


    // 선택한 지역 이동
    const handleSelectSlot = (slot: RegionSlot) => {
        setActiveSlot(slot);
        if (mobileTab === 'compare') setMobileTab('map'); // 모바일에서 선택 시 지도로 전환
    };

    const subwayCount = facilities.filter((f) => f.facility_type === 'SUBWAY').length;
    const parkCount = facilities.filter((f) => f.facility_type === 'PARK').length;
    const govCount = facilities.filter((f) => f.facility_type === 'GOV').length;
    const hospitalCount = facilities.filter((f) => f.facility_type === 'HOSPITAL').length;

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
            {/* 1. 상단 네비게이션 헤더 (반응형 적용) */}
            <header
                className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <span className="text-lg md:text-xl font-black tracking-tight text-blue-600">ZIPGyeol</span>
                    <span className="text-xs md:text-base font-bold text-slate-800">주거환경 비교</span>
                    <span
                        className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Beta</span>
                </div>

                {/* VWorld 장소 검색 폼 */}
                <form onSubmit={handleSearch} className="relative w-44 sm:w-64 md:w-[450px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5  text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`[${activeSlot.id} 슬롯] 장소/주소 검색 (예: 강남역, 역삼동)`}
                        disabled={isSearching}
                        className="w-full px-4 py-2 text-sm indent-3 text-slate-900 bg-slate-100 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all disabled:opacity-50 focus:ring-blue-500"
                    />
                </form>

                <div className="hidden md:flex items-center gap-3 text-slate-500">
                    <button className="p-2 hover:bg-slate-100 rounded-full"><Bell className="w-4 h-4"/></button>
                    <button className="p-2 hover:bg-slate-100 rounded-full"><User className="w-4 h-4"/></button>
                </div>
            </header>

            {/* 2. 메인 뷰포트 (데스크탑: 3열 / 모바일: 탭 기반) */}
            <div className="flex flex-1 overflow-hidden relative pb-14 md:pb-0">

                {/* [좌측/중앙] 지도 및 상세 정보 패널 */}
                <div className={`flex-1 flex-col min-w-0 ${mobileTab === 'compare' ? 'hidden md:flex' : 'flex'}`}>

                    {/* 지도 영역 (모바일 'details' 탭에서는 숨김) */}
                    <div className={`relative flex-1 ${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
                        {/* activeSlot 전달 */}
                        <VWorldMap activeSlot={activeSlot} slots={slots} onSelectSlot={handleSelectSlot}
                                   onFacilitiesFetched={(data) => setFacilities(data)}/>

                        {/* 모바일 화면 (1) - 선택 지역 비교 오버레이 카드 */}
                        <div className="md:hidden absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-800">선택 지역 비교</span>
                                <span className="text-[10px] text-slate-400">3개 선택됨</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold mb-2">
                                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">A 역삼동</div>
                                <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">B 서초동</div>
                                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">C 잠실동</div>
                            </div>
                            <div
                                className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg flex justify-between items-center">
                                <span>평균 매매가(3.3m²)</span>
                                <span className="font-bold text-blue-600">A: 4.8억 ▲12%</span>
                            </div>
                        </div>
                    </div>

                    {/* 하단/모바일 상세 정보 패널 (모바일 'details' 탭에서는 전면 노출) */}
                    <RegionDetailSection
                        activeSlotName={activeSlot.name}
                        facilities={facilities}
                        mobileTab={mobileTab}
                    />
                </div>

                {/* [우측] 비교 분석 패널 (모바일 'compare' 탭에서 전체 화면 전면 노출) */}
                <aside className={`${mobileTab === 'compare' ? 'flex flex-1 w-full' : 'hidden md:block md:w-[380px]'} shrink-0 h-full overflow-hidden`}>
                    {/* slots 및 슬롯 변경 함수 전달 */}
                    <AnalysisPanel facilities={facilities} slots={slots} activeSlot={activeSlot} onSelectSlot={handleSelectSlot} />
                </aside>

            </div>

            {/* 3. 모바일 전용 하단 탭 네비게이션 바 (시안 모바일 화면 연동) */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-around z-30 shadow-lg">
                <button
                    onClick={() => setMobileTab('map')}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        mobileTab === 'map' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                >
                    <MapIcon className="w-5 h-5"/>
                    <span>지도 보기</span>
                </button>
                <button
                    onClick={() => setMobileTab('details')}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        mobileTab === 'details' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                >
                    <ListFilter className="w-5 h-5"/>
                    <span>지역 상세</span>
                </button>
                <button
                    onClick={() => setMobileTab('compare')}
                    className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                        mobileTab === 'compare' ? 'text-blue-600' : 'text-slate-400'
                    }`}
                >
                    <BarChart3 className="w-5 h-5"/>
                    <span>비교 분석</span>
                </button>
            </nav>
        </div>
    );
}