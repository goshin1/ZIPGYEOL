import { useMemo } from 'react';
import { Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AXIS_TICK, TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES } from '@/constants/facilities';
import { SLOT_IDS } from '@/constants/slots';
import { calculateScores, countByType } from '@/lib/scores';
import type { Facility, RegionSlot, SlotId, SlotRecord } from '@/types';

interface ComparisonRadarProps {
    slots: RegionSlot[];
    activeSlotId: SlotId;
    slotFacilities: SlotRecord<Facility[]>;
}

/** 슬롯 3개의 카테고리별 인프라 점수 비교 */
export default function ComparisonRadar({ slots, activeSlotId, slotFacilities }: ComparisonRadarProps) {
    // [{ subject: '녹지', A: 50, B: 80, C: 20 }, ...]
    const radarData = useMemo(() => {
        const scores = Object.fromEntries(
            SLOT_IDS.map((id) => [id, calculateScores(countByType(slotFacilities[id]))]),
        ) as SlotRecord<ReturnType<typeof calculateScores>>;

        return FACILITY_TYPE_KEYS.map((type) => ({
            subject: FACILITY_TYPES[type].scoreLabel,
            ...Object.fromEntries(SLOT_IDS.map((id) => [id, scores[id][type]])),
        }));
    }, [slotFacilities]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
                <PolarGrid className="stroke-slate-200 dark:stroke-slate-700/60" />
                <PolarAngleAxis dataKey="subject" tick={AXIS_TICK} />
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
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
        </ResponsiveContainer>
    );
}
