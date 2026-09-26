import type { RegionSlot } from '@/types';

/** 모바일 전용: 지도 하단에 떠 있는 선택 지역 요약 카드 */
export default function MobileSlotSummary({ slots }: { slots: RegionSlot[] }) {
    return (
        <div className="md:hidden absolute bottom-4 left-4 right-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">선택 지역 비교</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{slots.length}개 선택됨</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-bold">
                {slots.map((slot) => (
                    <div
                        key={slot.id}
                        className="p-1.5 rounded-lg truncate"
                        style={{ backgroundColor: `${slot.color}15`, color: slot.color }}
                    >
                        {slot.id} {slot.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
