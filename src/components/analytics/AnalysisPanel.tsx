'use client';

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from 'recharts';
import { RegionSlot } from "@/app/page";
import { calculateEnvironmentScores, FacilityItem } from "@/lib/calculator";

interface AnalysisPanelProps {
    slots: RegionSlot[];
    activeSlot: RegionSlot;
    facilities: FacilityItem[];
    onSelectSlot: (slot: RegionSlot) => void;
}

// 시세 추이 데이터 (억 원 단위)
const priceTrendData = [
    { year: '2020', regionA: 14.2, regionB: 12.5, regionC: 10.8 },
    { year: '2021', regionA: 16.8, regionB: 14.2, regionC: 12.1 },
    { year: '2022', regionA: 15.5, regionB: 13.0, regionC: 11.2 },
    { year: '2023', regionA: 16.2, regionB: 13.8, regionC: 11.9 },
    { year: '2024', regionA: 17.5, regionB: 14.9, regionC: 12.8 },
];

export default function AnalysisPanel({
                                          slots,
                                          activeSlot,
                                          facilities,
                                          onSelectSlot,
                                      }: AnalysisPanelProps) {
    // 실시간 조회된 facilities 기반 점수 계산
    const currentScores = useMemo(() => calculateEnvironmentScores(facilities), [facilities]);

    return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-6 transition-colors">
            {/* 1. 지역 선택 탭 */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">비교 분석 리포트</h2>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">단위: 억 원 / 점</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => onSelectSlot(slot)}
                            className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                                activeSlot.id === slot.id
                                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500 shadow-md'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {slot.id} {slot.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. 시세 변동 추이 차트 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4">
                    아파트 매매 실거래가 추이 (최근 5년)
                </h3>
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                            <XAxis
                                dataKey="year"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                className="text-slate-500 dark:text-slate-400"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                className="text-slate-500 dark:text-slate-400"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--tw-prose-invert, #0f172a)',
                                    borderRadius: '12px',
                                    borderColor: '#334155',
                                    color: '#f8fafc',
                                    fontSize: '12px',
                                }}
                                formatter={(value) => [`${value ?? 0}억 원`, '']}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Line type="monotone" dataKey="regionA" name="강남구 역삼동" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="regionB" name="서초구 서초동" stroke="#9333ea" strokeWidth={2.5} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="regionC" name="송파구 잠실동" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. 주거 환경 방사형(Radar) 차트 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">입지 주거 환경 다각도 비교</h3>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={currentScores}>
                            <PolarGrid className="stroke-slate-200 dark:stroke-slate-800" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }} className="text-slate-600 dark:text-slate-400" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name={activeSlot.name}
                                dataKey="score"
                                stroke={activeSlot.color || '#2563eb'}
                                fill={activeSlot.color || '#2563eb'}
                                fillOpacity={0.35}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                                formatter={(value: any) => [`${value ?? 0}점`, '점수']}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}