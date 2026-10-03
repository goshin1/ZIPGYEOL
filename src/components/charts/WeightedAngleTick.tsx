import { FACILITY_TYPE_KEYS, FACILITY_TYPES } from '@/constants/facilities';
import type { InfraWeights } from '@/constants/weights';
import { AXIS_TICK } from './chartTheme';

interface AngleTickProps {
    x: number | string;
    y: number | string;
    textAnchor: 'start' | 'middle' | 'end' | 'inherit';
    payload: { value: string };
}

/**
 * 인프라 레이더 축 이름에 가중치를 붙이는 tick 렌더러 (예: "교통 ×3").
 * 가중치 0(종합 점수 제외)인 축은 흐리게 표시한다. 축 값은 FACILITY_TYPES의 scoreLabel이어야 한다.
 */
export function createWeightedAngleTick(weights: InfraWeights) {
    return function WeightedAngleTick({ x, y, textAnchor, payload }: AngleTickProps) {
        const type = FACILITY_TYPE_KEYS.find((key) => FACILITY_TYPES[key].scoreLabel === payload.value);
        const weight = type ? weights[type] : 1;
        return (
            <text
                x={x}
                y={y}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill={AXIS_TICK.fill}
                fontSize={AXIS_TICK.fontSize}
                opacity={weight === 0 ? 0.35 : 1}
            >
                {payload.value}
                <tspan fontWeight={700} dx={3}>
                    ×{weight}
                </tspan>
            </text>
        );
    };
}
