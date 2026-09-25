'use client';

import { useState } from 'react';
import { BarChart3, Home, Users } from 'lucide-react';
import SegmentedTabs, { type TabItem } from '@/components/ui/SegmentedTabs';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES } from '@/constants/facilities';
import { cn } from '@/lib/cn';
import type { Facility, MobileTab, RegionSlot } from '@/types';
import FacilityTab from './FacilityTab';
import PopulationTab from './PopulationTab';
import RealEstateTab from './RealEstateTab';

type SubView = 'facility' | 'population' | 'realestate';

const SUB_VIEW_TABS: TabItem<SubView>[] = [
    { value: 'facility', label: '인프라 분석', icon: BarChart3 },
    { value: 'population', label: '인구 구조', icon: Users },
    { value: 'realestate', label: '부동산 실거래가', icon: Home },
];

interface RegionDetailSectionProps {
    slot: RegionSlot;
    facilities: Facility[];
    mobileTab: MobileTab;
}

/** 지도 하단: 활성 슬롯의 인프라 / 인구 / 실거래가 상세 */
export default function RegionDetailSection({ slot, facilities, mobileTab }: RegionDetailSectionProps) {
    const [subView, setSubView] = useState<SubView>('facility');
    const facilityLabels = FACILITY_TYPE_KEYS.map((type) => FACILITY_TYPES[type].label).join('·');

    return (
        <div
            className={cn(
                'w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex-col gap-3 shrink-0 transition-colors',
                mobileTab === 'details' ? 'flex flex-1 min-h-0 overflow-y-auto' : 'hidden md:flex',
            )}
        >
            <div className="flex flex-col gap-3">
                <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>선택 지역 상세 분석</span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                            {slot.name}
                        </span>
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                        {facilityLabels} 인프라 환경, 연령별 인구 분포 및 주택 유형별 매매 실거래가 추이 리포트입니다.
                    </p>
                </div>

                <SegmentedTabs items={SUB_VIEW_TABS} value={subView} onChange={setSubView} stretch className="w-full" />
            </div>

            {subView === 'facility' && <FacilityTab facilities={facilities} />}
            {subView === 'population' && <PopulationTab slot={slot} />}
            {subView === 'realestate' && <RealEstateTab slot={slot} />}
        </div>
    );
}
