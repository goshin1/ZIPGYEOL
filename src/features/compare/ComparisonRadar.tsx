import { useMemo } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import { createWeightedAngleTick } from '@/components/charts/WeightedAngleTick';
import EmptyState from '@/components/ui/EmptyState';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES } from '@/constants/facilities';
import { SLOT_IDS } from '@/constants/slots';
import { useInfraWeights } from '@/hooks/useInfraWeights';
import { cn } from '@/lib/cn';
import { calculateScores, calculateWeightedTotal, countByType } from '@/lib/scores';
import type { Facility, RegionSlot, SlotId, SlotRecord } from '@/types';

interface ComparisonRadarProps {
    slots: RegionSlot[];
    activeSlotId: SlotId;
    slotFacilities: SlotRecord<Facility[]>;
    loading: boolean;
}

/** 슬롯 3개의 카테고리별 인프라 점수 비교 + 가중치 기준 종합 점수 */
export default function ComparisonRadar({ slots, activeSlotId, slotFacilities, loading }: ComparisonRadarProps) {
    const { weights } = useInfraWeights();

    const scores = useMemo(
        () =>
            Object.fromEntries(
                SLOT_IDS.map((id) => [id, calculateScores(countByType(slotFacilities[id]))]),
            ) as SlotRecord<ReturnType<typeof calculateScores>>,
        [slotFacilities],
    );

    // [{ subject: '녹지', A: 50, B: 80, C: 20 }, ...]
    const radarData = FACILITY_TYPE_KEYS.map((type) => ({
        subject: FACILITY_TYPES[type].scoreLabel,
        ...Object.fromEntries(SLOT_IDS.map((id) => [id, scores[id][type]])),
    }));

    const totals = Object.fromEntries(
        SLOT_IDS.map((id) => [id, calculateWeightedTotal(scores[id], weights)]),
    ) as SlotRecord<number>;
    const bestTotal = Math.max(...SLOT_IDS.map((id) => totals[id]));

    const angleTick = useMemo(() => createWeightedAngleTick(weights), [weights]);

    if (loading) return <EmptyState message="주변 시설 정보를 불러오는 중..." />;

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                        <PolarGrid className="stroke-slate-200 dark:stroke-slate-700/60" />
                        <PolarAngleAxis dataKey="subject" tick={angleTick} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        {slots.map((slot) => (
                            <Radar
                                key={slot.id}
                                name={`[${slot.id}] ${slot.name}`}
                                dataKey={slot.id}
                                stroke={slot.color}
                                fill={slot.color}
                                fillOpacity={activeSlotId === slot.id ? 0.4 : 0.15}
                            />
                        ))}
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* 범례 겸 종합 점수 (가중치 반영) */}
            <div className="grid grid-cols-3 gap-1 shrink-0 text-[10px]">
                {slots.map((slot) => {
                    const isBest = bestTotal > 0 && totals[slot.id] === bestTotal;
                    return (
                        <div
                            key={slot.id}
                            className={cn(
                                'flex items-center justify-center gap-1 px-1 py-0.5 rounded-md min-w-0',
                                activeSlotId === slot.id && 'bg-white dark:bg-slate-700/60',
                            )}
                        >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slot.color }} />
                            <span className="truncate text-slate-500 dark:text-slate-400">
                                {slot.id} {slot.name}
                            </span>
                            <span className="font-extrabold tabular-nums text-slate-800 dark:text-slate-100 shrink-0">
                                {totals[slot.id]}점
                            </span>
                            {isBest && (
                                <span className="shrink-0" title="종합 점수 1위">
                                    👑
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
