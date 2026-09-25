import { FACILITY_TYPE_KEYS, FACILITY_TYPES, type FacilityType, isFacilityType } from '@/constants/facilities';
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
