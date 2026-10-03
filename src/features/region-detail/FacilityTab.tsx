import { useMemo, useState } from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_PRIMARY, TOOLTIP_STYLE } from '@/components/charts/chartTheme';
import { createWeightedAngleTick } from '@/components/charts/WeightedAngleTick';
import EmptyState from '@/components/ui/EmptyState';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES, type FacilityType } from '@/constants/facilities';
import WeightEditor from '@/features/weights/WeightEditor';
import { useInfraWeights } from '@/hooks/useInfraWeights';
import { calculateScores, calculateWeightedTotal, countByType } from '@/lib/scores';
import type { Facility } from '@/types';

const CARD_CLASS =
    'bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[255px] transition-colors';

const LOADING_MESSAGE = '주변 시설 정보를 불러오는 중...';

export default function FacilityTab({ facilities, loading }: { facilities: Facility[]; loading: boolean }) {
    const [category, setCategory] = useState<FacilityType>('PARK');
    const { weights } = useInfraWeights();

    const counts = useMemo(() => countByType(facilities), [facilities]);
    const scores = useMemo(() => calculateScores(counts), [counts]);
    const totalScore = calculateWeightedTotal(scores, weights);

    const radarData = FACILITY_TYPE_KEYS.map((type) => ({
        subject: FACILITY_TYPES[type].scoreLabel,
        score: scores[type],
    }));
    const angleTick = useMemo(() => createWeightedAngleTick(weights), [weights]);

    const filtered = useMemo(
        () =>
            facilities
                .filter((f) => f.facility_type === category)
                .sort((a, b) => a.distance_meters - b.distance_meters),
        [facilities, category],
    );

    const categoryTabs = FACILITY_TYPE_KEYS.map((type) => ({
        value: type,
        label: loading ? FACILITY_TYPES[type].label : `${FACILITY_TYPES[type].label} (${counts[type]})`,
    }));

    return (
        <div className="flex flex-col gap-2">
            <SegmentedTabs items={categoryTabs} value={category} onChange={setCategory} variant="solid" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 시설 목록 */}
                <div className={CARD_CLASS}>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                        <span>{FACILITY_TYPES[category].label} 목록</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">거리순</span>
                    </h3>
                    <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                        {loading ? (
                            <EmptyState message={LOADING_MESSAGE} />
                        ) : filtered.length > 0 ? (
                            filtered.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 transition-colors flex justify-between items-center"
                                >
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[160px]">
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        {Math.round(item.distance_meters)}m
                                    </span>
                                </div>
                            ))
                        ) : (
                            <EmptyState message="해당 유형의 시설이 반경 내에 없습니다." />
                        )}
                    </div>
                </div>

                {/* 카테고리별 개수 */}
                <div className={CARD_CLASS}>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">주변 인프라 분포</h3>
                    <div className="grid grid-cols-2 gap-1.5 my-auto">
                        {FACILITY_TYPE_KEYS.map((type) => {
                            const { label, icon: Icon, badgeClass } = FACILITY_TYPES[type];
                            return (
                                <div
                                    key={type}
                                    className={`p-2 rounded-lg border ${badgeClass} flex items-center justify-between transition-colors`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <Icon className="w-3.5 h-3.5" />
                                        <span className="text-xs font-semibold">{label}</span>
                                    </div>
                                    <span className="text-xs font-extrabold">
                                        {loading ? '…' : `${counts[type]}개`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 종합 점수 */}
                <div className={CARD_CLASS}>
                    <div className="flex items-center justify-between gap-2">
                        <h3
                            className="text-xs font-bold text-slate-800 dark:text-slate-200"
                            title="축: 카테고리별 기준 최대 개수 대비 비율(100점 만점) / 종합: 가중 평균"
                        >
                            {FACILITY_TYPE_KEYS.length}종 인프라 종합 점수
                        </h3>
                        <WeightEditor />
                    </div>
                    {loading ? (
                        <EmptyState message={LOADING_MESSAGE} />
                    ) : (
                        <div className="flex items-center gap-2 flex-1 min-h-0">
                            <div className="shrink-0 text-center w-16">
                                <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                                    {totalScore}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500">/ 100점</div>
                            </div>
                            <div className="flex-1 h-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="62%" data={radarData}>
                                        <PolarGrid className="stroke-slate-200 dark:stroke-slate-700/60" />
                                        <PolarAngleAxis dataKey="subject" tick={angleTick} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="입지점수"
                                            dataKey="score"
                                            stroke={CHART_PRIMARY}
                                            fill={CHART_PRIMARY}
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-100 dark:border-slate-700/50">
                        축: 시설 수를 기준 최대치 대비 100점으로 환산 · 종합: 가중치(×N) 기준 가중 평균
                    </div>
                </div>
            </div>
        </div>
    );
}
