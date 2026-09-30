'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import MobileTabBar from '@/components/layout/MobileTabBar';
import Toast from '@/components/ui/Toast';
import { DEFAULT_SLOTS } from '@/constants/slots';
import AnalysisPanel from '@/features/compare/AnalysisPanel';
import MobileSlotSummary from '@/features/map/MobileSlotSummary';
import RegionDetailSection from '@/features/region-detail/RegionDetailSection';
import { useSlotBoundaries } from '@/hooks/useRegionBoundary';
import { useSlotFacilities } from '@/hooks/useRegionData';
import { useToast } from '@/hooks/useToast';
import { parseRegion } from '@/lib/address';
import type { GeocodeResult } from '@/lib/api/geocoding';
import { findSigunguBoundaryAt } from '@/lib/api/regions';
import { parseBoundaryKey } from '@/lib/regionBoundary';
import { toSlotRegion } from '@/lib/regionSearch';
import type { MobileTab, RegionEntry, RegionSlot, SlotId } from '@/types';

// OpenLayers는 브라우저 전용이라 서버 렌더링에서 제외
const VWorldMap = dynamic(() => import('@/features/map/VWorldMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
            공간 지도를 로딩 중입니다...
        </div>
    ),
});

export default function Home() {
    const [mobileTab, setMobileTab] = useState<MobileTab>('map');
    const [slots, setSlots] = useState<RegionSlot[]>(DEFAULT_SLOTS);
    // 활성 슬롯은 id만 저장하고 객체는 slots에서 파생 (같은 데이터를 두 곳에 두지 않기 위함)
    const [activeSlotId, setActiveSlotId] = useState<SlotId>('A');
    const activeSlot = slots.find((slot) => slot.id === activeSlotId)!;

    const slotFacilities = useSlotFacilities(slots);
    const slotBoundaries = useSlotBoundaries(slots);
    const { message: toastMessage, showToast } = useToast();

    const handleSelectSlot = (id: SlotId) => {
        setActiveSlotId(id);
        if (mobileTab === 'compare') setMobileTab('map');
    };

    // 주소 검색 성공 → 좌표가 들어 있는 시군구 경계로 활성 슬롯의 지역/좌표/경계 교체
    const handleAddressFound = async ({ lat, lng, address }: GeocodeResult) => {
        // 경계 파일을 못 받아도 주소 문자열로 지역은 맞출 수 있으니 오류는 '경계 없음'으로 처리한다
        const sigungu = await findSigunguBoundaryAt(lat, lng).catch(() => null);
        if (sigungu) {
            const { key, code } = sigungu.properties;
            updateActiveSlot({ ...toSlotRegion(parseBoundaryKey(key)), code, lat, lng });
            return;
        }

        const parsed = parseRegion(address);
        if (!parsed) {
            showToast(`'${address}'에서 시·군·구를 찾을 수 없습니다.`);
            return;
        }
        updateActiveSlot({ ...parsed, code: '', lat, lng });
    };

    // 지역 후보 선택 → 활성 슬롯을 해당 지역 중심 좌표/경계로 교체
    const handleRegionSelect = (entry: RegionEntry) => {
        updateActiveSlot({ ...toSlotRegion(entry), code: entry.code, lat: entry.lat, lng: entry.lng });
    };

    const updateActiveSlot = (next: Pick<RegionSlot, 'name' | 'region' | 'code' | 'lat' | 'lng'>) => {
        setSlots((prev) => prev.map((slot) => (slot.id === activeSlotId ? { ...slot, ...next } : slot)));
        showToast(`[${activeSlotId} 슬롯] '${next.name}'(으)로 설정되었습니다.`);
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
            <Toast message={toastMessage} />

            <Header
                activeSlotId={activeSlotId}
                onFound={handleAddressFound}
                onRegionSelect={handleRegionSelect}
                onMessage={showToast}
            />

            <div className="flex flex-1 overflow-hidden relative pb-14 md:pb-0">
                {/* 좌측/중앙: 지도 + 상세 패널 */}
                <div className={`flex-1 flex-col min-w-0 ${mobileTab === 'compare' ? 'hidden md:flex' : 'flex'}`}>
                    <div className={`relative flex-1 ${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
                        <VWorldMap
                            slots={slots}
                            activeSlot={activeSlot}
                            facilities={slotFacilities[activeSlotId]}
                            boundaries={slotBoundaries}
                            onSelectSlot={handleSelectSlot}
                        />
                        <MobileSlotSummary slots={slots} />
                    </div>

                    <RegionDetailSection
                        slot={activeSlot}
                        facilities={slotFacilities[activeSlotId]}
                        mobileTab={mobileTab}
                    />
                </div>

                {/* 우측: 비교 분석 패널 */}
                <aside
                    className={`${
                        mobileTab === 'compare' ? 'flex flex-1 w-full' : 'hidden md:flex md:w-[380px]'
                    } shrink-0 h-full overflow-hidden bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-colors`}
                >
                    <AnalysisPanel
                        slots={slots}
                        activeSlot={activeSlot}
                        slotFacilities={slotFacilities}
                        onSelectSlot={handleSelectSlot}
                    />
                </aside>
            </div>

            <MobileTabBar value={mobileTab} onChange={setMobileTab} />
        </div>
    );
}
