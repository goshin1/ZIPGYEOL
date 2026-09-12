'use client';

import { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    Legend,
} from 'recharts';
import { RegionSlot } from '@/app/page';
import { FacilityItem } from '@/lib/calculator';
import { TrendingUp, Layers } from 'lucide-react';

interface AnalysisPanelProps {
    slotFacilities: Record<'A' | 'B' | 'C', FacilityItem[]>;
    slots: RegionSlot[];
    activeSlot: RegionSlot;
    onSelectSlot: (slot: RegionSlot) => void;
}

export default function AnalysisPanel({
                                          slotFacilities,
                                          slots,
                                          activeSlot,
                                          onSelectSlot,
                                      }: AnalysisPanelProps) {
    const [selectedTab, setSelectedTab] = useState<'trend' | 'radar'>('trend');

    // 1. 슬롯별 실거래가 추이 데이터 (가변 슬롯 이름 반영)
    const priceTrendData = useMemo(() => {
        return [
            { year: '2022', [slots[0]?.name || 'A']: 12.5, [slots[1]?.name || 'B']: 10.2, [slots[2]?.name || 'C']: 8.1 },
            { year: '2023', [slots[0]?.name || 'A']: 13.1, [slots[1]?.name || 'B']: 10.8, [slots[2]?.name || 'C']: 8.3 },
            { year: '2024', [slots[0]?.name || 'A']: 12.8, [slots[1]?.name || 'B']: 11.5, [slots[2]?.name || 'C']: 8.7 },
            { year: '2025', [slots[0]?.name || 'A']: 14.2, [slots[1]?.name || 'B']: 12.1, [slots[2]?.name || 'C']: 9.0 },
            { year: '2026', [slots[0]?.name || 'A']: 15.0, [slots[1]?.name || 'B']: 12.8, [slots[2]?.name || 'C']: 9.4 },
        ];
    }, [slots]);

    // 2. A, B, C 각 슬롯별 시설 개수 개별 집계
    const slotCounts = useMemo(() => {
        const result: Record<'A' | 'B' | 'C', Record<string, number>> = {
            A: { SUBWAY: 0, PARK: 0, HOSPITAL: 0, SCHOOL: 0, STORE: 0 },
            B: { SUBWAY: 0, PARK: 0, HOSPITAL: 0, SCHOOL: 0, STORE: 0 },
            C: { SUBWAY: 0, PARK: 0, HOSPITAL: 0, SCHOOL: 0, STORE: 0 },
        };

        (['A', 'B', 'C'] as const).forEach((id) => {
            const items = slotFacilities[id] || [];
            items.forEach((item) => {
                if (result[id][item.facility_type] !== undefined) {
                    result[id][item.facility_type] += 1;
                }
            });
        });

        return result;
    }, [slotFacilities]);

    // 3. A, B, C 실제 데이터 기반 레이더 차트 점수 산출
    const radarData = useMemo(() => {
        const calcScore = (count: number, maxExpected: number) =>
            Math.min(100, Math.round((count / maxExpected) * 100));

        return [
            {
                subject: '교통',
                A: calcScore(slotCounts.A.SUBWAY, 5),
                B: calcScore(slotCounts.B.SUBWAY, 5),
                C: calcScore(slotCounts.C.SUBWAY, 5),
            },
            {
                subject: '녹지',
                A: calcScore(slotCounts.A.PARK, 8),
                B: calcScore(slotCounts.B.PARK, 8),
                C: calcScore(slotCounts.C.PARK, 8),
            },
            {
                subject: '의료',
                A: calcScore(slotCounts.A.HOSPITAL, 6),
                B: calcScore(slotCounts.B.HOSPITAL, 6),
                C: calcScore(slotCounts.C.HOSPITAL, 6),
            },
            {
                subject: '교육',
                A: calcScore(slotCounts.A.SCHOOL, 8),
                B: calcScore(slotCounts.B.SCHOOL, 8),
                C: calcScore(slotCounts.C.SCHOOL, 8),
            },
            {
                subject: '편의',
                A: calcScore(slotCounts.A.STORE, 12),
                B: calcScore(slotCounts.B.STORE, 12),
                C: calcScore(slotCounts.C.STORE, 12),
            },
        ];
    }, [slotCounts]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 overflow-y-auto space-y-4">
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-base">비교 분석 리포트</h2>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">단위: 억원 / 점</span>
            </div>

            {/* 슬롯 빠른 전환 탭 */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                {slots.map((slot) => {
                    const isActive = activeSlot.id === slot.id;
                    return (
                        <button
                            key={slot.id}
                            onClick={() => onSelectSlot(slot)}
                            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                                isActive
                                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: slot.color }} />
                                <span>[{slot.id}] 슬롯</span>
                            </div>
                            <span className="truncate max-w-[80px] text-[10px] opacity-80">{slot.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* 차트 뷰 전환 서브 탭 */}
            <div className="flex gap-2">
                <button
                    onClick={() => setSelectedTab('trend')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        selectedTab === 'trend'
                            ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                >
                    <TrendingUp className="w-3.5 h-3.5" />
                    실거래가 추이
                </button>
                <button
                    onClick={() => setSelectedTab('radar')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        selectedTab === 'radar'
                            ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                >
                    <Layers className="w-3.5 h-3.5" />
                    입지 다각도 비교
                </button>
            </div>

            {/* 1. 아파트 매매 실거래가 추이 차트 */}
            {selectedTab === 'trend' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300">
                        아파트 평균 매매가 추이 (최근 5년)
                    </h3>
                    <div className="w-full h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={priceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700/60" />
                                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: '8px',
                                        borderColor: '#334155',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                                {slots.map((slot) => (
                                    <Line
                                        key={slot.id}
                                        type="monotone"
                                        dataKey={slot.name}
                                        stroke={slot.color}
                                        strokeWidth={activeSlot.id === slot.id ? 3 : 1.5}
                                        dot={{ r: activeSlot.id === slot.id ? 4 : 2 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* 2. 입지 환경 다각도 레이더 차트 */}
            {selectedTab === 'radar' && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-xs font-bold mb-3 text-slate-700 dark:text-slate-300">
                        3개 슬롯 입지 조건 다중 비교
                    </h3>
                    <div className="w-full h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                <PolarGrid className="stroke-slate-200 dark:stroke-slate-700/60" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                {slots.map((slot) => (
                                    <Radar
                                        key={slot.id}
                                        name={`[${slot.id}] ${slot.name}`}
                                        dataKey={slot.id}
                                        stroke={slot.color}
                                        fill={slot.color}
                                        fillOpacity={activeSlot.id === slot.id ? 0.4 : 0.15}
                                    />
                                ))}
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
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
            )}
        </div>
    );
}