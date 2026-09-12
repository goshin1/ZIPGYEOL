'use client';

import { useMemo, useState } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import { Trees, Landmark, School, Hospital, Train, Store } from 'lucide-react';
import { FacilityItem } from "@/lib/calculator";

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
    GOV: {
        label: '공공기관',
        icon: Landmark,
        color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
    },
    SCHOOL: {
        label: '학교',
        icon: School,
        color: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/60'
    },
    HOSPITAL: {
        label: '병원',
        icon: Hospital,
        color: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60'
    },
    SUBWAY: {
        label: '지하철/교통',
        icon: Train,
        color: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60'
    },
    STORE: {
        label: '편의시설',
        icon: Store,
        color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
    },
};

export default function RegionDetailSection({ activeSlotName, facilities, mobileTab }: RegionDetailProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('PARK');

    // 1. 카테고리별 시설 개수 집계
    const counts = useMemo(() => {
        const acc: Record<string, number> = {
            PARK: 0, GOV: 0, SCHOOL: 0, HOSPITAL: 0, SUBWAY: 0, STORE: 0,
        };
        facilities.forEach((item) => {
            if (acc[item.facility_type] !== undefined) {
                acc[item.facility_type] += 1;
            }
        });
        return acc;
    }, [facilities]);

    // 2. 생활권 종합 점수 계산
    const radarData = useMemo(() => {
        const calcScore = (count: number, maxExpected: number = 10) =>
            Math.min(100, Math.round((count / maxExpected) * 100));

        return [
            { subject: '교통 접근성', score: calcScore(counts.SUBWAY, 5) },
            { subject: '공원/녹지', score: calcScore(counts.PARK, 8) },
            { subject: '의료 시설', score: calcScore(counts.HOSPITAL, 6) },
            { subject: '교육 환경', score: calcScore(counts.SCHOOL, 8) },
            { subject: '편의 시설', score: calcScore(counts.STORE, 12) },
        ];
    }, [counts]);

    // 3. 선택된 카테고리의 시설 목록 (거리순 정렬)
    const filteredFacilities = useMemo(() => {
        return facilities
            .filter((f) => f.facility_type === selectedCategory)
            .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    }, [facilities, selectedCategory]);

    // 시설 데이터를 카테고리 별로 분류
    const categorized = useMemo(() => {
        const result = {
            SUBWAY: [] as FacilityItem[],
            PARK: [] as FacilityItem[],
            HOSPITAL: [] as FacilityItem[],
            SCHOOL: [] as FacilityItem[],
            STORE: [] as FacilityItem[],
        };

        facilities.forEach((item) => {
            if (result[item.facility_type as keyof typeof result]) {
                result[item.facility_type as keyof typeof result].push(item);
            }
        });

        return result;
    }, [facilities]);

    return (
        <div className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex-col gap-3 shrink-0 transition-colors ${
            mobileTab === 'details' ? 'flex flex-1' : 'hidden md:flex'
        }`}>
            {/* 상단 탭 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">선택 지역 상세 정보</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{activeSlotName}</span> 중심 2km 이내 주요 입지 분석
                    </p>
                </div>

                {/* 카테고리 필터 칩 */}
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
            </div>

            {/* 메인 콘텐츠 3열 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. 선택 카테고리 시설 상세 목록 */}
                <div className="bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[230px] transition-colors">
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

                {/* 2. 주변 환경 요약 개수 */}
                <div className="bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[230px] transition-colors">
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

                {/* 3. 생활권 종합 점수 레이더 차트 */}
                <div className="bg-white dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-between h-[230px] transition-colors">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 w-full text-left">생활권 입지 종합 점수</h3>
                    <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
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
                                        backgroundColor: '#0f172a',
                                        borderRadius: '8px',
                                        borderColor: '#334155',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}