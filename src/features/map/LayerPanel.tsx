import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES, type FacilityType } from '@/constants/facilities';

interface LayerPanelProps {
    enabled: Record<FacilityType, boolean>;
    onToggle: (type: FacilityType) => void;
}

/** 지도 좌측 레이어 on/off 패널 (접기/펴기 가능) */
export default function LayerPanel({ enabled, onToggle }: LayerPanelProps) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="absolute top-20 left-4 transition-all z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 w-44 overflow-hidden">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">주변 환경 레이어</h3>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
            </button>

            {isOpen && (
                <div className="p-3 pt-2 mt-1 space-y-2 border-t border-slate-100 dark:border-slate-800">
                    {FACILITY_TYPE_KEYS.map((type) => {
                        const { label, color, icon: Icon } = FACILITY_TYPES[type];
                        const isOn = enabled[type];
                        return (
                            <div key={type} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                    <span>{label}</span>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isOn}
                                    aria-label={`${label} 레이어`}
                                    onClick={() => onToggle(type)}
                                    className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                                        isOn
                                            ? 'bg-blue-600 justify-end'
                                            : 'bg-slate-300 dark:bg-slate-700 justify-start'
                                    }`}
                                >
                                    <span className="w-3 h-3 bg-white dark:bg-slate-200 rounded-full shadow-md" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
