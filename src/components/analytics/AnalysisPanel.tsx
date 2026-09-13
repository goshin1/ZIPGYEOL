// AnalysisPanel.tsx
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
import { TrendingUp, Layers, Home } from 'lucide-react';

interface RealEstateItem {
    id: string;
    apartmentName: string;
    area: number;
    dealYearMonth: string;
    floor: number;
    amount: number; // 만원 단위 또는 억 단위
}

interface AnalysisPanelProps {
    slotFacilities: Record<'A' | 'B' | 'C', FacilityItem[]>;
    slots: RegionSlot[];
    activeSlot: RegionSlot;
    onSelectSlot: (slot: RegionSlot) => void;
    recentTransactions?: Record<string, RealEstateItem[]>;
    mobileTab?: string; // 모바일 환경에서 탭 활성화 여부 제어용
}

export default function AnalysisPanel({
                                          slotFacilities,
                                          slots,
                                          activeSlot,
                                          onSelectSlot,
                                          recentTransactions = {},
                                          mobileTab = 'analysis',
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

    // 현재 활성화된 슬롯의 실제 실거래가 목록 추출 (안전 방어 코드 포함)
    const currentSlotTransactions = useMemo(() => {
        try {
            if (!activeSlot || !recentTransactions) return [];
            return recentTransactions[activeSlot.id] || [];
        } catch (e) {
            console.error("실거래가 데이터 파싱 오류:", e);
            return [];
        }
    }, [activeSlot, recentTransactions]);

    return (
        /* 💡 모바일에서는 w-full 전체 폭, 데스크톱에서는 기존 레이아웃 유지 및 내부 flex 구조로 남은 높이 가득 채우기 */
        <div className={`w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-3 sm:p-4 flex flex-col h-full overflow-hidden transition-colors ${
            mobileTab === 'analysis' ? 'flex flex-1 min-h-0' : 'hidden md:flex'
        }`}>
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h2 className="font-bold text-sm sm:text-base">비교 분석 리포트</h2>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">단위: 억원 / 점</span>
            </div>

            {/* 슬롯 빠른 전환 탭 */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl my-2.5 shrink-0">
                {slots.map((slot) => {
                    const isActive = activeSlot.id === slot.id;
                    return (
                        <button
                            key={slot.id}
                            onClick={() => onSelectSlot(slot)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
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
            <div className="flex gap-2 shrink-0 mb-3">
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

            {/* 상단 차트 영역 (고정 크기 유지) */}
            <div className="shrink-0 mb-3">
                {selectedTab === 'trend' && (
                    <div className="p-3 h-60 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                        <h3 className="text-xs font-bold mb-2 text-slate-700 dark:text-slate-300">
                            아파트 평균 매매가 추이 (최근 5년)
                        </h3>
                        <div className="w-full h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={priceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700/60" />
                                    <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--tooltip-bg, #0f172a)',
                                            borderRadius: '8px',
                                            borderColor: 'var(--tooltip-border, #334155)',
                                            color: 'var(--tooltip-text, #ffffff)',
                                            fontSize: '11px',
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
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

                {selectedTab === 'radar' && (
                    <div className="p-3 h-60 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                3개 슬롯 입지 조건 다중 비교
                            </h3>
                            <span className="text-[10px] text-slate-400">100점 만점 정규화</span>
                        </div>

                        <div className="w-full h-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={radarData}>
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
                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} />
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

                        <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-200 dark:border-slate-700/50">
                            산출: 각 카테고리별 기대 최대치 대비 비율 환산
                        </div>
                    </div>
                )}
            </div>

            {/* 💡 하단 실거래가 주요 내역 섹션: flex-1과 overflow-y-auto를 통해 남은 수직 공간을 채우고 스크롤 처리 */}
            <div className="flex-1 min-h-0 flex flex-col pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2 shrink-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>최근 실거래가 주요 내역 ({activeSlot.name})</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">최신 거래순</span>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                    {priceTrendData && priceTrendData.length > 0 ? (
                        priceTrendData.slice(-5).reverse().map((item, index) => {
                            // 현재 더미 데이터에서 A, B, C 슬롯 중 현재 활성화된 슬롯의 값을 가져옵니다.
                            const priceVal = (item as any)[activeSlot.name] ?? 0;
                            const dateVal = (item as any).year ?? '최근';

                            return (
                                <div
                                    key={index}
                                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs shrink-0"
                                >
                                    <div>
                                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                                            {activeSlot.name} 평균 실거래가
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            기준년도: {dateVal}년
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {/* 더미 데이터(15.0 등)가 이미 '억' 단위이므로 바로 '억원'을 붙여줍니다 */}
                                        <div className="font-bold text-blue-600 dark:text-blue-400">
                                            {Number(priceVal).toFixed(1)}억원
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                            표출할 실거래가 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}