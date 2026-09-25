import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_PRIMARY, TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import EmptyState from '@/components/ui/EmptyState';
import SegmentedTabs, { type TabItem } from '@/components/ui/SegmentedTabs';
import { useRealEstateTrends } from '@/hooks/useRegionData';
import { manwonToEok } from '@/lib/realEstate';
import type { HousingType, RegionSlot } from '@/types';

const HOUSING_TABS: TabItem<HousingType>[] = [
    { value: 'ALL', label: '전체' },
    { value: '아파트', label: '아파트' },
    { value: '연립다세대', label: '연립다세대' },
    { value: '단독다가구', label: '단독다가구' },
];

export default function RealEstateTab({ slot }: { slot: RegionSlot }) {
    const [housingType, setHousingType] = useState<HousingType>('ALL');
    const { data: trends, error, loading } = useRealEstateTrends(slot.region, housingType);

    const renderBody = () => {
        if (loading) return <EmptyState message="실거래가 데이터를 불러오는 중..." />;
        if (error) return <EmptyState message="실거래가 데이터를 불러오지 못했습니다." />;
        if (!trends || trends.length === 0) {
            return <EmptyState message="선택된 조건의 거래 내역이 없습니다. (시/군/구 단위 명칭인지 확인해주세요)" />;
        }
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis
                        dataKey="deal_month"
                        tick={{ fontSize: 10 }}
                        stroke="currentColor"
                        className="text-slate-500"
                    />
                    <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(val: number) => `${manwonToEok(val).toFixed(1)}억`}
                        stroke="currentColor"
                        className="text-slate-500"
                    />
                    <Tooltip
                        formatter={(value) => [`${Math.round(Number(value)).toLocaleString()} 만원`, '평균 매매가']}
                        labelFormatter={(label) => `계약년월: ${label}`}
                        contentStyle={TOOLTIP_STYLE}
                    />
                    <Line
                        type="monotone"
                        dataKey="avg_price"
                        stroke={CHART_PRIMARY}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[255px] transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    주택 유형별 매매 실거래가 추이 ({slot.name})
                </h3>
                <SegmentedTabs
                    items={HOUSING_TABS}
                    value={housingType}
                    onChange={setHousingType}
                    size="sm"
                    className="gap-1 rounded-lg dark:bg-slate-900"
                />
            </div>
            <div className="flex-1 min-h-0 w-full">{renderBody()}</div>
        </div>
    );
}
