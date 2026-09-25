import { Home } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { manwonToEok } from '@/lib/realEstate';
import type { RealEstateTrend, RegionSlot } from '@/types';

const RECENT_MONTHS = 6;

/** 활성 슬롯의 최근 월별 평균 실거래가 */
export default function RecentDeals({ slot, trends }: { slot: RegionSlot; trends: RealEstateTrend[] }) {
    const recent = trends.slice(-RECENT_MONTHS).reverse();

    return (
        <div className="flex-1 min-h-0 flex flex-col pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2 shrink-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>최근 월별 평균 실거래가 ({slot.name})</span>
                </h4>
                <span className="text-[10px] text-slate-400">최신순</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
                {recent.length > 0 ? (
                    recent.map((item) => (
                        <div
                            key={item.deal_month}
                            className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs shrink-0"
                        >
                            <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                    {item.deal_month}
                                </div>
                                <div className="text-[10px] text-slate-500">거래 {item.deal_count}건</div>
                            </div>
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                                {manwonToEok(item.avg_price).toFixed(1)}억원
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState message="표출할 실거래가 데이터가 없습니다." />
                )}
            </div>
        </div>
    );
}
