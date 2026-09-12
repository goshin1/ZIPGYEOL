'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, Bell, User, Map as MapIcon, ListFilter, BarChart3, Building2, Trees, Landmark, School, Train, Store, Hospital } from 'lucide-react';
import AnalysisPanel from "@/components/analytics/AnalysisPanel";

const VWorldMap = dynamic(() => import('@/components/map/VWorldMap'), {
  ssr: false,
  loading: () => (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs">
        VWORLD 공간 지도를 로딩 중입니다...
      </div>
  ),
});

export default function Home() {
  // 모바일 전용 탭 상태 ('map' | 'details' | 'compare')
  const [mobileTab, setMobileTab] = useState<'map' | 'details' | 'compare'>('map');

  return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
        {/* 1. 상단 네비게이션 헤더 (반응형 적용) */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-black tracking-tight text-blue-600">VWorld</span>
            <span className="text-xs md:text-base font-bold text-slate-800">주거환경 비교</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">Beta</span>
          </div>

          {/* 검색바 (모바일은 유연하게 축소) */}
          <div className="relative w-44 sm:w-64 md:w-[450px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
                type="text"
                placeholder="지역, 아파트, 공원 검색"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 rounded-full border border-transparent focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="hidden md:flex items-center gap-3 text-slate-500">
            <button className="p-2 hover:bg-slate-100 rounded-full"><Bell className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-slate-100 rounded-full"><User className="w-4 h-4" /></button>
          </div>
        </header>

        {/* 2. 메인 뷰포트 (데스크탑: 3열 / 모바일: 탭 기반) */}
        <div className="flex flex-1 overflow-hidden relative pb-14 md:pb-0">

          {/* [좌측/중앙] 지도 및 상세 정보 패널 */}
          <div className={`flex-1 flex-col min-w-0 ${mobileTab === 'compare' ? 'hidden md:flex' : 'flex'}`}>

            {/* 지도 영역 (모바일 'details' 탭에서는 숨김) */}
            <div className={`relative flex-1 ${mobileTab === 'details' ? 'hidden md:block' : 'block'}`}>
              <VWorldMap />

              {/* 모바일 화면 (1) - 선택 지역 비교 오버레이 카드 */}
              <div className="md:hidden absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-800">선택 지역 비교</span>
                  <span className="text-[10px] text-slate-400">3개 선택됨</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold mb-2">
                  <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">A 역삼동</div>
                  <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">B 서초동</div>
                  <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">C 잠실동</div>
                </div>
                <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg flex justify-between items-center">
                  <span>평균 매매가(3.3m²)</span>
                  <span className="font-bold text-blue-600">A: 4.8억 ▲12%</span>
                </div>
              </div>
            </div>

            {/* 하단/모바일 상세 정보 패널 (모바일 'details' 탭에서는 전면 노출) */}
            <div className={`bg-white border-t border-slate-200 p-4 flex-col gap-3 shrink-0 overflow-y-auto ${
                mobileTab === 'details' ? 'flex flex-1 md:h-72' : 'hidden md:flex md:h-72'
            }`}>
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="font-bold text-slate-800 text-xs md:text-sm">선택 지역 상세 정보</h2>
                <div className="flex gap-1 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold whitespace-nowrap">아파트 (12)</button>
                  <button className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium whitespace-nowrap">공원 (5)</button>
                  <button className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium whitespace-nowrap">공공기관 (4)</button>
                  <button className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium whitespace-nowrap">교통 (3)</button>
                </div>
              </div>

              {/* 카드 목록 (모바일 1열 / 데스크탑 3열) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="font-bold text-xs text-slate-700 mb-1">대표 아파트 매물</div>
                  <div className="bg-white p-2.5 rounded-lg border text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">역삼동 현대아파트</div>
                      <div className="text-[10px] text-slate-400">전용 84m² | 준공 2012년</div>
                    </div>
                    <div className="font-black text-blue-600 text-xs">매매 12.5억</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">서초동 래미안아파트</div>
                      <div className="text-[10px] text-slate-400">전용 59m² | 준공 2018년</div>
                    </div>
                    <div className="font-black text-blue-600 text-xs">매매 15.8억</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 space-y-2">
                  <div className="font-bold text-xs text-slate-700 mb-1">주변 환경 정보</div>
                  <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                    <div className="p-1.5 bg-white rounded border font-bold text-blue-600">공원 4</div>
                    <div className="p-1.5 bg-white rounded border font-bold text-blue-600">공공 3</div>
                    <div className="p-1.5 bg-white rounded border font-bold text-blue-600">학교 6</div>
                    <div className="p-1.5 bg-white rounded border font-bold text-blue-600">병원 2</div>
                    <div className="p-1.5 bg-white rounded border font-bold text-blue-600">지하철 8</div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 flex flex-col justify-between">
                  <div className="font-bold text-xs text-slate-700">생활권 종합 점수</div>
                  <div className="h-20 border border-dashed rounded-lg flex items-center justify-center text-xs text-slate-400">
                    Radar Chart (Recharts)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* [우측] 비교 분석 패널 (모바일 'compare' 탭에서 전체 화면 전면 노출) */}
          <aside className="w-80 xl:w-96 h-full flex-shrink-0 hidden lg:block border-l border-slate-200">
            <AnalysisPanel />
          </aside>

        </div>

        {/* 3. 모바일 전용 하단 탭 네비게이션 바 (시안 모바일 화면 연동) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-around z-30 shadow-lg">
          <button
              onClick={() => setMobileTab('map')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                  mobileTab === 'map' ? 'text-blue-600' : 'text-slate-400'
              }`}
          >
            <MapIcon className="w-5 h-5" />
            <span>지도 보기</span>
          </button>
          <button
              onClick={() => setMobileTab('details')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                  mobileTab === 'details' ? 'text-blue-600' : 'text-slate-400'
              }`}
          >
            <ListFilter className="w-5 h-5" />
            <span>지역 상세</span>
          </button>
          <button
              onClick={() => setMobileTab('compare')}
              className={`flex flex-col items-center gap-1 text-[10px] font-semibold ${
                  mobileTab === 'compare' ? 'text-blue-600' : 'text-slate-400'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>비교 분석</span>
          </button>
        </nav>
      </div>
  );
}