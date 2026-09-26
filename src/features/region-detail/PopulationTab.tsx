import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_PRIMARY, TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import EmptyState from '@/components/ui/EmptyState';
import { usePopulation } from '@/hooks/useRegionData';
import type { PopulationRow, RegionSlot } from '@/types';

function toAgeChartData(row: PopulationRow) {
    return [
        { age: '0~9세', count: row.age_0_9 },
        { age: '10대', count: row.age_10_19 },
        { age: '20대', count: row.age_20_29 },
        { age: '30대', count: row.age_30_39 },
        { age: '40대', count: row.age_40_49 },
        { age: '50대', count: row.age_50_59 },
        { age: '60대', count: row.age_60_69 },
        { age: '70대', count: row.age_70_79 },
        { age: '80대', count: row.age_80_89 },
        { age: '90세+', count: row.age_90_99 + row.age_100_plus },
    ];
}

export default function PopulationTab({ slot }: { slot: RegionSlot }) {
    const { data: population, error, loading } = usePopulation(slot.region);
    const chartData = useMemo(() => (population ? toAgeChartData(population) : []), [population]);

    const renderBody = () => {
        if (loading) return <EmptyState message="인구 데이터를 불러오는 중..." />;
        if (error) return <EmptyState message="인구 데이터를 불러오지 못했습니다." />;
        if (chartData.length === 0) {
            return (
                <EmptyState
                    message={`해당 지역(${slot.name})의 인구 데이터를 찾을 수 없습니다. (시/군/구 단위 명칭인지 확인해주세요)`}
                />
            );
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="age" tick={{ fontSize: 10 }} stroke="currentColor" className="text-slate-500" />
                    <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val: number) => `${(val / 10000).toFixed(0)}만`}
                        stroke="currentColor"
                        className="text-slate-500"
                    />
                    <Tooltip
                        formatter={(val) => [`${Number(val).toLocaleString()} 명`, '인구수']}
                        contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="count" fill={CHART_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[255px] transition-colors">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    연령대별 인구 분포 현황 ({slot.name})
                </h3>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    총 인구수:{' '}
                    <strong className="text-blue-600 dark:text-blue-400 ml-1">
                        {(population?.total_pop ?? 0).toLocaleString()}명
                    </strong>
                </span>
            </div>
            <div className="flex-1 min-h-0 w-full">{renderBody()}</div>
        </div>
    );
}
