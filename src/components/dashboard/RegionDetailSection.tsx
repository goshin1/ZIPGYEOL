// RegionDetailSection.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
} from 'recharts';
import { Trees, Hospital, Train, Pill, Users, Home, BarChart3 } from 'lucide-react';
import { FacilityItem } from "@/lib/calculator";
import { supabase } from '@/lib/supabase';

interface RegionDetailProps {
    activeSlotName: string;
    facilities: FacilityItem[];
    mobileTab: string;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
    PARK: {
        label: '공원',
        icon: Trees,
        color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
    },
    HOSPITAL: {
        label: '병원',
        icon: Hospital,
        color: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60'
    },
    SUBWAY: {
        label: '지하철',
        icon: Train,
        color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
    },
    PHARMACY: {
        label: '약국',
        icon: Pill,
        color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/60'
    },
};

export default function RegionDetailSection({ activeSlotName, facilities, mobileTab }: RegionDetailProps) {
    const [subView, setSubView] = useState<'facility' | 'population' | 'realestate'>('facility');
    const [selectedCategory, setSelectedCategory] = useState<string>('PARK');

    const [popData, setPopData] = useState<any>(null);
    const [ageChartData, setAgeChartData] = useState<any[]>([]);

    const [selectedHousingType, setSelectedHousingType] = useState<string>('ALL');
    const [trendData, setTrendData] = useState<any[]>([]);
    const [loadingRealEstate, setLoadingRealEstate] = useState<boolean>(false);

    const targetQuery = useMemo(() => {
        let name = activeSlotName || '';
        if (name.endsWith('역')) {
            name = name.replace('역', '');
        }
        return name;
    }, [activeSlotName]);

    const counts = useMemo(() => {
        const acc: Record<string, number> = {
            PARK: 0,
            HOSPITAL: 0,
            SUBWAY: 0,
            PHARMACY: 0,
        };
        facilities.forEach((item) => {
            if (acc[item.facility_type] !== undefined) {
                acc[item.facility_type] += 1;
            }
        });
        return acc;
    }, [facilities]);

    const radarData = useMemo(() => {
        const calcScore = (count: number, maxExpected: number) =>
            Math.min(100, Math.round((count / maxExpected) * 100));

        return [
            { subject: '공원/녹지', score: calcScore(counts.PARK, 8) },
            { subject: '의료 시설', score: calcScore(counts.HOSPITAL, 6) },
            { subject: '약국 인프라', score: calcScore(counts.PHARMACY, 10) },
            { subject: '교통 접근성', score: calcScore(counts.SUBWAY, 5) },
        ];
    }, [counts]);

    const filteredFacilities = useMemo(() => {
        return facilities
            .filter((f) => f.facility_type === selectedCategory)
            .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    }, [facilities, selectedCategory]);

    useEffect(() => {
        async function fetchPopulation() {
            if (!targetQuery) return;
            const { data, error } = await supabase.rpc('get_population_by_region', {
                region_name: targetQuery
            });

            if (!error && data && data.length > 0) {
                const row = data[0];
                setPopData(row);
                setAgeChartData([
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
                ]);
            } else {
                setPopData(null);
                setAgeChartData([]);
            }
        }
        fetchPopulation();
    }, [targetQuery]);

    useEffect(() => {
        async function fetchRealEstate() {
            if (!targetQuery) return;
            setLoadingRealEstate(true);

            const { data, error } = await supabase.rpc('get_real_estate_trends', {
                sigungu_input: targetQuery,
                housing_type_input: selectedHousingType
            });

            if (!error && data) {
                setTrendData(data);
            } else {
                setTrendData([]);
            }
            setLoadingRealEstate(false);
        }
        fetchRealEstate();
    }, [targetQuery, selectedHousingType]);

    return (
        <div className={`w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex flex-col gap-3 shrink-0 transition-colors ${
            mobileTab === 'details' ? 'flex flex-1 min-h-0 overflow-y-auto' : 'hidden md:flex'
        }`}>
            {/* 상단 탭 헤더 */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>선택 지역 상세 분석</span>
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                {activeSlotName}
                            </span>
                        </h2>
                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                            공원·약국·병원·지하철 인프라 환경, 연령별 인구 분포 및 2022~2026년 주택 유형별 매매 실거래가 추이 리포트입니다.
                        </p>
                    </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full">
                    <button
                        onClick={() => setSubView('facility')}
                        className={`flex-1 min-w-[100px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                            subView === 'facility'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                        <span>인프라 분석</span>
                    </button>
                    <button
                        onClick={() => setSubView('population')}
                        className={`flex-1 min-w-[90px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                            subView === 'population'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>인구 구조</span>
                    </button>
                    <button
                        onClick={() => setSubView('realestate')}
                        className={`flex-1 min-w-[110px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                            subView === 'realestate'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Home className="w-3.5 h-3.5 shrink-0" />
                        <span>부동산 실거래가</span>
                    </button>
                </div>
            </div>

            {/* 콘텐츠 영역 */}
            {subView === 'facility' && (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(CATEGORY_MAP).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    selectedCategory === key
                                        ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                            >
                                {config.label} ({counts[key] || 0})
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 시설 목록 카드 */}
                        <div className="bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[255px] transition-colors">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                                <span>{CATEGORY_MAP[selectedCategory]?.label} 목록</span>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">거리순</span>
                            </h3>
                            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                                {filteredFacilities.length > 0 ? (
                                    filteredFacilities.map((item) => (
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
                                    <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                                        해당 유형의 시설이 반경 내에 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4종 주변 인프라 분포 카드 */}
                        <div className="bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[255px] transition-colors">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">주변 인프라 분포</h3>
                            <div className="grid grid-cols-2 gap-1.5 my-auto">
                                {Object.entries(CATEGORY_MAP).map(([key, config]) => {
                                    const IconComponent = config.icon;
                                    return (
                                        <div
                                            key={key}
                                            className={`p-2 rounded-lg border ${config.color} flex items-center justify-between transition-colors`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <IconComponent className="w-3.5 h-3.5" />
                                                <span className="text-xs font-semibold">{config.label}</span>
                                            </div>
                                            <span className="text-xs font-extrabold">{counts[key]}개</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 4종 인프라 종합 점수 카드 */}
                        <div className="bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[255px] transition-colors">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">4종 인프라 종합 점수</h3>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500" title="기준 최대 개수 대비 비율(100점 만점 정규화)">
                                    ⓘ 산출 기준
                                </span>
                            </div>
                            <div className="w-full h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                                        <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: 'currentColor', fontSize: 10 }}
                                            className="text-slate-600 dark:text-slate-400"
                                        />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                            name="입지점수"
                                            dataKey="score"
                                            stroke="#2563eb"
                                            fill="#3b82f6"
                                            fillOpacity={0.4}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--tooltip-bg, #0f172a)',
                                                borderRadius: '8px',
                                                borderColor: 'var(--tooltip-border, #334155)',
                                                color: 'var(--tooltip-text, #ffffff)',
                                                fontSize: '11px',
                                            }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-100 dark:border-slate-700/50">
                                공원·약국·병원·지하철 시설 수를 기준 최대치 대비 100점으로 환산
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {subView === 'population' && (
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[255px] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            연령대별 인구 분포 현황 ({targetQuery})
                        </h3>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            총 인구수: <strong className="text-blue-600 dark:text-blue-400 ml-1">{popData?.total_pop?.toLocaleString() ?? 0}명</strong>
                        </span>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        {ageChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageChartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="age" tick={{ fontSize: 10 }} stroke="currentColor" className="text-slate-500" />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`} stroke="currentColor" className="text-slate-500" />
                                    <Tooltip
                                        formatter={(val: any) => [`${Number(val).toLocaleString()} 명`, '인구수']}
                                        contentStyle={{
                                            backgroundColor: 'var(--tooltip-bg, #0f172a)',
                                            borderRadius: '8px',
                                            borderColor: 'var(--tooltip-border, #334155)',
                                            color: 'var(--tooltip-text, #ffffff)',
                                            fontSize: '11px',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                해당 지역({targetQuery})의 인구 데이터를 찾을 수 없습니다. (시/군/구 단위 명칭인지 확인해주세요)
                            </div>
                        )}
                    </div>
                </div>
            )}

            {subView === 'realestate' && (
                <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[255px] transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            2022~2026 주택 유형별 매매 실거래가 추이 ({targetQuery})
                        </h3>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            {['ALL', '아파트', '연립다세대', '단독다가구'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedHousingType(type)}
                                    className={`px-2 py-0.5 text-[11px] rounded-md transition-all ${
                                        selectedHousingType === type
                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {type === 'ALL' ? '전체' : type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 w-full">
                        {loadingRealEstate ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                실거래가 데이터를 불러오는 중...
                            </div>
                        ) : trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="deal_year_month" tick={{ fontSize: 10 }} stroke="currentColor" className="text-slate-500" />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(val) => `${(val / 10000).toFixed(1)}억`}
                                        stroke="currentColor"
                                        className="text-slate-500"
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [`${Number(value).toLocaleString()} 만원`, '평균 매매가']}
                                        labelFormatter={(label) => `계약년월: ${label}`}
                                        contentStyle={{
                                            backgroundColor: 'var(--tooltip-bg, #0f172a)',
                                            borderRadius: '8px',
                                            borderColor: 'var(--tooltip-border, #334155)',
                                            color: 'var(--tooltip-text, #ffffff)',
                                            fontSize: '11px',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="avg_price"
                                        stroke="#2563eb"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 5 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                선택된 조건의 거래 내역이 없습니다. (시/군/구 단위 명칭인지 확인해주세요)
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}