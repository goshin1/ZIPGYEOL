import type { RegionSlot, SlotId } from '@/types';

interface SlotChipsProps {
    slots: RegionSlot[];
    activeSlotId: SlotId;
    onSelectSlot: (id: SlotId) => void;
}

/** 지도 상단 A/B/C 슬롯 선택 칩 */
export default function SlotChips({ slots, activeSlotId, onSelectSlot }: SlotChipsProps) {
    return (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">지역 선택</span>
            <div className="flex gap-1.5">
                {slots.map((slot) => (
                    <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSelectSlot(slot.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                            activeSlotId === slot.id
                                ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-slate-200 scale-105'
                                : 'opacity-80'
                        }`}
                        style={{ backgroundColor: slot.color, color: '#ffffff' }}
                    >
                        <span
                            className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] font-bold"
                            style={{ color: slot.color }}
                        >
                            {slot.id}
                        </span>
                        {slot.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
