import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import EmptyState from '@/components/ui/EmptyState';
import { manwonToEok, toYearlyAverage } from '@/lib/realEstate';
import type { RealEstateTrend, RegionSlot, SlotId, SlotRecord } from '@/types';

interface PriceTrendChartProps {
    slots: RegionSlot[];
    activeSlotId: SlotId;
    trends: SlotRecord<RealEstateTrend[]>;
}

/** 슬롯별 연 평균 매매가 추이 (억원) */
export default function PriceTrendChart({ slots, activeSlotId, trends }: PriceTrendChartProps) {
    // [{ year: '2022', A: 20.1, B: 12.3, C: 15.0 }, ...] 형태로 변환 (키는 슬롯 id라 이름이 겹쳐도 안전)
    const chartData = useMemo(() => {
        const rows = new Map<string, Record<string, number | string>>();
        for (const slot of slots) {
            for (const { year, avgPrice } of toYearlyAverage(trends[slot.id])) {
                const row = rows.get(year) ?? { year };
                row[slot.id] = Number(manwonToEok(avgPrice).toFixed(1));
                rows.set(year, row);
            }
        }
        return [...rows.values()].sort((a, b) => String(a.year).localeCompare(String(b.year)));
    }, [slots, trends]);

    if (chartData.length === 0) return <EmptyState message="표출할 실거래가 데이터가 없습니다." />;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700/60" />
                <XAxis dataKey="year" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => `${value}억원`} />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                {slots.map((slot) => (
                    <Line
                        key={slot.id}
                        type="monotone"
                        dataKey={slot.id}
                        name={`[${slot.id}] ${slot.name}`}
                        stroke={slot.color}
                        strokeWidth={activeSlotId === slot.id ? 3 : 1.5}
                        dot={{ r: activeSlotId === slot.id ? 4 : 2 }}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}
