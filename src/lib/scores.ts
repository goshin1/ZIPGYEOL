import { FACILITY_TYPE_KEYS, FACILITY_TYPES, type FacilityType, isFacilityType } from '@/constants/facilities';
import { DEFAULT_WEIGHTS, type InfraWeights, WEIGHT_MAX, WEIGHT_MIN } from '@/constants/weights';
import type { Facility } from '@/types';

export type FacilityCounts = Record<FacilityType, number>;

/** 카테고리별 시설 개수 집계 (표출 대상이 아닌 카테고리는 무시) */
export function countByType(facilities: Facility[]): FacilityCounts {
    const counts = Object.fromEntries(FACILITY_TYPE_KEYS.map((type) => [type, 0])) as FacilityCounts;
    for (const facility of facilities) {
        if (isFacilityType(facility.facility_type)) {
            counts[facility.facility_type] += 1;
        }
    }
    return counts;
}

/** 기대 최대치 대비 비율을 0~100점으로 환산 */
export function toScore(count: number, maxExpected: number): number {
    return Math.min(100, Math.round((count / maxExpected) * 100));
}

/** 카테고리별 점수 (카테고리 순서는 FACILITY_TYPES 정의 순서) */
export function calculateScores(counts: FacilityCounts): Record<FacilityType, number> {
    return Object.fromEntries(
        FACILITY_TYPE_KEYS.map((type) => [type, toScore(counts[type], FACILITY_TYPES[type].maxExpected)]),
    ) as Record<FacilityType, number>;
}

/** 가중 평균 종합 점수 (0~100). 가중치 합이 0이면 0점 */
export function calculateWeightedTotal(scores: Record<FacilityType, number>, weights: InfraWeights): number {
    let weighted = 0;
    let weightSum = 0;
    for (const type of FACILITY_TYPE_KEYS) {
        weighted += scores[type] * weights[type];
        weightSum += weights[type];
    }
    return weightSum > 0 ? Math.round(weighted / weightSum) : 0;
}

/** 저장소 등 신뢰할 수 없는 값을 가중치로 정리한다 (누락·잘못된 값은 기본값, 범위 밖은 잘라냄) */
export function sanitizeWeights(raw: unknown): InfraWeights {
    const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
    return Object.fromEntries(
        FACILITY_TYPE_KEYS.map((type) => {
            const value = source[type];
            if (typeof value !== 'number' || !Number.isFinite(value)) return [type, DEFAULT_WEIGHTS[type]];
            return [type, Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, Math.round(value)))];
        }),
    ) as InfraWeights;
}

export function isSameWeights(a: InfraWeights, b: InfraWeights): boolean {
    return FACILITY_TYPE_KEYS.every((type) => a[type] === b[type]);
}
