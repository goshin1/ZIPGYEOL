'use client';

import { useState } from 'react';
import { Layers, TrendingUp } from 'lucide-react';
import SegmentedTabs, { type TabItem } from '@/components/ui/SegmentedTabs';
import { useSlotRealEstateTrends } from '@/hooks/useRegionData';
import type { Facility, RegionSlot, SlotId, SlotRecord } from '@/types';
import ComparisonRadar from './ComparisonRadar';
import PriceTrendChart from './PriceTrendChart';
import RecentDeals from './RecentDeals';

type ChartView = 'trend' | 'radar';

const CHART_TABS: TabItem<ChartView>[] = [
    { value: 'trend', label: '실거래가 추이', icon: TrendingUp },
    { value: 'radar', label: '입지 다각도 비교', icon: Layers },
];

interface AnalysisPanelProps {
    slots: RegionSlot[];
    activeSlot: RegionSlot;
    slotFacilities: SlotRecord<Facility[]>;
    onSelectSlot: (id: SlotId) => void;
}

/** 우측: A/B/C 슬롯 비교 분석 */
export default function AnalysisPanel({ slots, activeSlot, slotFacilities, onSelectSlot }: AnalysisPanelProps) {
    const [chartView, setChartView] = useState<ChartView>('trend');
    const slotTrends = useSlotRealEstateTrends(slots);

    return (
        <div className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 sm:p-4 flex flex-col flex-1 min-h-0 h-full overflow-hidden transition-colors">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-sm sm:text-base">비교 분석 리포트</h2>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">단위: 억원 / 점</span>
            </div>

            {/* 슬롯 빠른 전환 */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl my-2.5 shrink-0">
                {slots.map((slot) => {
                    const isActive = activeSlot.id === slot.id;
                    return (
                        <button
                            key={slot.id}
                            type="button"
                            onClick={() => onSelectSlot(slot.id)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                                isActive
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: slot.color }} />
                                <span>[{slot.id}] 슬롯</span>
                            </div>
                            <span className="truncate max-w-[80px] text-[10px] opacity-80">{slot.name}</span>
                        </button>
                    );
                })}
            </div>

            <SegmentedTabs
                items={CHART_TABS}
                value={chartView}
                onChange={setChartView}
                variant="solid"
                stretch
                className="gap-2 shrink-0 mb-3 flex-nowrap"
            />

            <div className="shrink-0 mb-3 p-3 h-60 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {chartView === 'trend' ? '연 평균 매매가 추이 (전체 주택유형)' : '3개 슬롯 입지 조건 다중 비교'}
                    </h3>
                    {chartView === 'radar' && <span className="text-[10px] text-slate-400">100점 만점 정규화</span>}
                </div>
                <div className="w-full flex-1 min-h-0">
                    {chartView === 'trend' ? (
                        <PriceTrendChart slots={slots} activeSlotId={activeSlot.id} trends={slotTrends} />
                    ) : (
                        <ComparisonRadar slots={slots} activeSlotId={activeSlot.id} slotFacilities={slotFacilities} />
                    )}
                </div>
                {chartView === 'radar' && (
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-200 dark:border-slate-700/50">
                        산출: 각 카테고리별 기대 최대치 대비 비율 환산
                    </div>
                )}
            </div>

            <RecentDeals slot={activeSlot} trends={slotTrends[activeSlot.id]} />
        </div>
    );
}
