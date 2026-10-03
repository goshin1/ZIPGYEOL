'use client';

import { useId } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES } from '@/constants/facilities';
import { DEFAULT_WEIGHTS, WEIGHT_MAX, WEIGHT_MIN, WEIGHT_PRESETS } from '@/constants/weights';
import { useInfraWeights } from '@/hooks/useInfraWeights';
import { cn } from '@/lib/cn';
import { isSameWeights } from '@/lib/scores';

/**
 * 인프라 가중치 설정 버튼 + 팝오버.
 * 가중치는 전역 저장소(useInfraWeights)를 쓰므로 어디에 두어도 같은 값을 편집한다.
 * 부모의 overflow에 잘리지 않도록 HTML popover(top layer)로 띄운다.
 */
export default function WeightEditor() {
    const popoverId = useId();
    const { weights, setWeight, applyWeights } = useInfraWeights();
    const isCustom = !isSameWeights(weights, DEFAULT_WEIGHTS);

    return (
        <>
            <button
                type="button"
                popoverTarget={popoverId}
                title="인프라 가중치 설정"
                className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold transition-colors',
                    isCustom
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200',
                )}
            >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{isCustom ? '가중치 · 사용자 설정' : '가중치'}</span>
            </button>

            <div
                id={popoverId}
                popover="auto"
                className="w-[min(320px,calc(100vw-32px))] p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl backdrop:bg-slate-950/30"
            >
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold">인프라 가중치 설정</h3>
                    <button
                        type="button"
                        popoverTarget={popoverId}
                        popoverTargetAction="hide"
                        aria-label="닫기"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                    중요한 인프라일수록 높게 설정하세요. 종합 점수에만 반영되며, 0이면 제외됩니다.
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    {WEIGHT_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyWeights(preset.weights)}
                            className={cn(
                                'px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors',
                                isSameWeights(weights, preset.weights)
                                    ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700',
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                    {FACILITY_TYPE_KEYS.map((type) => {
                        const { label, scoreLabel, icon: Icon, color } = FACILITY_TYPES[type];
                        const inputId = `${popoverId}-${type}`;
                        return (
                            <div key={type}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <label htmlFor={inputId} className="flex items-center gap-1.5 font-semibold">
                                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                                        <span>
                                            {scoreLabel}
                                            {scoreLabel !== label && (
                                                <span className="text-slate-400 font-normal"> ({label})</span>
                                            )}
                                        </span>
                                    </label>
                                    <span className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
                                        {weights[type] === 0 ? '제외' : `×${weights[type]}`}
                                    </span>
                                </div>
                                <input
                                    id={inputId}
                                    type="range"
                                    min={WEIGHT_MIN}
                                    max={WEIGHT_MAX}
                                    step={1}
                                    value={weights[type]}
                                    onChange={(e) => setWeight(type, Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
