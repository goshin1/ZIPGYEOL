import type { FacilityType } from '@/constants/facilities';

export type InfraWeights = Record<FacilityType, number>;

/** 가중치 슬라이더 범위 (0 = 종합 점수에서 제외) */
export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 5;

/** 모든 카테고리를 같은 비중으로 보는 기본값 */
export const DEFAULT_WEIGHTS: InfraWeights = { PARK: 1, HOSPITAL: 1, PHARMACY: 1, SUBWAY: 1 };

export interface WeightPreset {
    id: string;
    label: string;
    weights: InfraWeights;
}

export const WEIGHT_PRESETS: WeightPreset[] = [
    { id: 'balanced', label: '균형', weights: DEFAULT_WEIGHTS },
    { id: 'transit', label: '교통 중시', weights: { PARK: 1, HOSPITAL: 1, PHARMACY: 1, SUBWAY: 5 } },
    { id: 'medical', label: '의료 중시', weights: { PARK: 1, HOSPITAL: 5, PHARMACY: 3, SUBWAY: 1 } },
    { id: 'green', label: '녹지 중시', weights: { PARK: 5, HOSPITAL: 1, PHARMACY: 1, SUBWAY: 1 } },
];
