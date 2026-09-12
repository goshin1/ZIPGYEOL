'use client';

import { useMemo, useState } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from 'recharts';
import { Building2, Trees, Landmark, School, Hospital, Train, Store } from 'lucide-react';
import { FacilityItem } from "@/lib/calculator";

interface RegionDetailProps {
    activeSlotName: string;
    facilities: FacilityItem[];
    mobileTab: string;
}

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
    APT: { label: '아파트', icon: Building2, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    PARK: { label: '공원', icon: Trees, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    GOV: { label: '공공기관', icon: Landmark, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    SCHOOL: { label: '학교', icon: School, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    HOSPITAL: { label: '병원', icon: Hospital, color: 'bg-red-50 text-red-600 border-red-200' },
    SUBWAY: { label: '지하철/교통', icon: Train, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    STORE: { label: '편의시설', icon: Store, color: 'bg-amber-50 text-amber-600 border-amber-200' },
};

export default function RegionDetailSection({ activeSlotName, facilities, mobileTab }: RegionDetailProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('APT');

    // 1. 카테고리별 시설 개수 집계
    const counts = useMemo(() => {
        const acc: Record<string, number> = {
            APT: 0, PARK: 0, GOV: 0, SCHOOL: 0, HOSPITAL: 0, SUBWAY: 0, STORE: 0,
        };
        facilities.forEach((item) => {
            if (acc[item.facility_type] !== undefined) {
                acc[item.facility_type] += 1;
            }
        });
        return acc;
    }, [facilities]);

    // 2. 생활권 종합 점수 계산 (시설 수를 100점 만점 레이더 스코어로 환산)
    const radarData = useMemo(() => {
        const calcScore = (count: number, maxExpected: number = 10) =>
            Math.min(100, Math.round((count / maxExpected) * 100));

        return [
            { subject: '교통 접근성', score: calcScore(counts.SUBWAY, 5), fullMark: 100 },
            { subject: '공원/녹지', score: calcScore(counts.PARK, 8), fullMark: 100 },
            { subject: '의료 시설', score: calcScore(counts.HOSPITAL, 6), fullMark: 100 },
            { subject: '교육 환경', score: calcScore(counts.SCHOOL, 8), fullMark: 100 },
            { subject: '편의 시설', score: calcScore(counts.STORE, 12), fullMark: 100 },
        ];
    }, [counts]);

    // 3. 선택된 카테고리의 시설 목록 (거리순 정렬)
    const filteredFacilities = useMemo(() => {
        return facilities
            .filter((f) => f.facility_type === selectedCategory)
            .sort((a, b) => (a.distance_meters || 0) - (b.distance_meters || 0));
    }, [facilities, selectedCategory]);

    return (
        <div className={`bg-white border-t border-slate-200 p-4 flex-col gap-3 shrink-0 ${
            mobileTab === 'details' ? 'flex flex-1' : 'hidden md:flex'
        }`}>
            {/* 상단 탭 헤더 */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h2 className="text-base font-bold text-slate-900">선택 지역 상세 정보</h2>
                    <p className="text-xs text-slate-500">
                        <span className="font-semibold text-blue-600">{activeSlotName}</span> 중심 2km 이내 주요 입지 분석
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
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
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
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between h-[230px]">
                    <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                        <span>{CATEGORY_MAP[selectedCategory]?.label} 목록</span>
                        <span className="text-[11px] text-slate-400 font-normal">거리순</span>
                    </h3>
                    <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                        {filteredFacilities.length > 0 ? (
                            filteredFacilities.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-2 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50/50 transition-colors flex justify-between items-center"
                                >
                                    <span className="font-semibold text-slate-800 text-xs truncate max-w-[160px]">
                                        {item.name}
                                    </span>
                                    <span className="text-[10px] font-bold text-blue-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                        {Math.round(item.distance_meters)}m
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                해당 유형의 시설이 반경 내에 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. 주변 환경 요약 개수 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between h-[230px]">
                    <h3 className="text-xs font-bold text-slate-800 mb-2">주변 인프라 분포</h3>
                    <div className="grid grid-cols-2 gap-1.5 my-auto">
                        {Object.entries(CATEGORY_MAP).map(([key, config]) => {
                            const IconComponent = config.icon;
                            return (
                                <div
                                    key={key}
                                    className={`p-2 rounded-lg border ${config.color} flex items-center justify-between`}
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
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col items-center justify-between h-[230px]">
                    <h3 className="text-xs font-bold text-slate-800 w-full text-left">생활권 입지 종합 점수</h3>
                    <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar
                                    name="입지점수"
                                    dataKey="score"
                                    stroke="#2563eb"
                                    fill="#3b82f6"
                                    fillOpacity={0.4}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}