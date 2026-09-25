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
import { useSlotFacilities } from '@/hooks/useRegionData';
import { useToast } from '@/hooks/useToast';
import { parseRegion } from '@/lib/address';
import type { GeocodeResult } from '@/lib/api/geocoding';
import type { MobileTab, RegionSlot, SlotId } from '@/types';

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
    const { message: toastMessage, showToast } = useToast();

    const handleSelectSlot = (id: SlotId) => {
        setActiveSlotId(id);
        if (mobileTab === 'compare') setMobileTab('map');
    };

    // 주소 검색 성공 → 활성 슬롯의 지역/좌표 교체
    const handleAddressFound = ({ lat, lng, address }: GeocodeResult) => {
        const parsed = parseRegion(address);
        if (!parsed) {
            showToast(`'${address}'에서 시·군·구를 찾을 수 없습니다.`);
            return;
        }
        setSlots((prev) => prev.map((slot) => (slot.id === activeSlotId ? { ...slot, ...parsed, lat, lng } : slot)));
        showToast(`[${activeSlotId} 슬롯] '${parsed.name}'(으)로 설정되었습니다.`);
    };

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
            <Toast message={toastMessage} />

            <Header activeSlotId={activeSlotId} onFound={handleAddressFound} onMessage={showToast} />

            <div className="flex flex-1 overflow-hidden relative pb-14 md:pb-0">
                {/* 좌측/중앙: 지도 + 상세 패널 */}
                <div className={`flex-1 flex-col min-w-0 ${mobileTab === 'compare' ? 'hidden md:flex' : 'flex'}`}>
                    <div className={`relative flex-1 ${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
                        <VWorldMap
                            slots={slots}
                            activeSlot={activeSlot}
                            facilities={slotFacilities[activeSlotId]}
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
