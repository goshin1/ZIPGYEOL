'use client';

import { useState } from 'react';
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

// 시세 추이 데이터 (억 원 단위)
const priceTrendData = [
    { year: '2020', regionA: 14.2, regionB: 12.5, regionC: 10.8 },
    { year: '2021', regionA: 16.8, regionB: 14.2, regionC: 12.1 },
    { year: '2022', regionA: 15.5, regionB: 13.0, regionC: 11.2 },
    { year: '2023', regionA: 16.2, regionB: 13.8, regionC: 11.9 },
    { year: '2024', regionA: 17.5, regionB: 14.9, regionC: 12.8 },
];

// 주거 환경 평가 지표 데이터 (100점 만점)
const environmentRadarData = [
    { category: '교통 접근성', regionA: 95, regionB: 80, regionC: 70 },
    { category: '공원/녹지', regionA: 65, regionB: 85, regionC: 90 },
    { category: ' 의료 시설', regionA: 90, regionB: 75, regionC: 60 },
    { category: '교육 환경', regionA: 85, regionB: 90, regionC: 65 },
    { category: '편의 시설', regionA: 92, regionB: 70, regionC: 75 },
];

export default function AnalysisPanel() {
    const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C'>('A');

    return (
        <div className="w-full h-full bg-slate-50 border-l border-slate-200 p-4 overflow-y-auto space-y-6">
            {/* 1. 지역 선택 탭 */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-bold text-slate-800">비교 분석 리포트</h2>
                    <span className="text-[11px] font-medium text-slate-400">단위: 억 원 / 점</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setActiveTab('A')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                            activeTab === 'A'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        A 강남구 역삼동
                    </button>
                    <button
                        onClick={() => setActiveTab('B')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                            activeTab === 'B'
                                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        B 서초구 서초동
                    </button>
                    <button
                        onClick={() => setActiveTab('C')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all border ${
                            activeTab === 'C'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        C 송파구 잠실동
                    </button>
                </div>
            </div>

            {/* 2. 시세 변동 추이 차트 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 mb-4">아파트 매매 실거래가 추이 (최근 5년)</h3>
                <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#e2e8f0', fontSize: '12px' }}
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 mb-2">입지 주거 환경 다각도 비교</h3>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={environmentRadarData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="강남구 역삼동" dataKey="regionA" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
                            <Radar name="서초구 서초동" dataKey="regionB" stroke="#9333ea" fill="#9333ea" fillOpacity={0.25} />
                            <Radar name="송파구 잠실동" dataKey="regionC" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', fontSize: '11px' }} />
                            <Legend wrapperStyle={{ fontSize: '11px' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}