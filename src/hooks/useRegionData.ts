import { useCallback } from 'react';
import { getNearbyFacilities } from '@/lib/api/facilities';
import { getPopulation } from '@/lib/api/population';
import { getRealEstateTrends } from '@/lib/api/realEstate';
import type { Facility, HousingType, RegionSlot, SlotRecord } from '@/types';
import { useAsyncData } from './useAsyncData';

// 지역 단위 데이터 조회 훅 모음. 컴포넌트는 이 훅만 쓰고 Supabase를 직접 호출하지 않는다.

export function useNearbyFacilities(lat: number, lng: number) {
    const fetcher = useCallback((signal: AbortSignal) => getNearbyFacilities(lat, lng, signal), [lat, lng]);
    return useAsyncData(fetcher);
}

/** 3개 슬롯 각각의 좌표 기준 주변 시설 (슬롯 개수가 고정이라 훅을 명시적으로 3번 호출) */
export function useSlotFacilities(slots: RegionSlot[]): SlotRecord<Facility[]> {
    const [a, b, c] = slots;
    const facilitiesA = useNearbyFacilities(a.lat, a.lng).data;
    const facilitiesB = useNearbyFacilities(b.lat, b.lng).data;
    const facilitiesC = useNearbyFacilities(c.lat, c.lng).data;
    return { A: facilitiesA ?? [], B: facilitiesB ?? [], C: facilitiesC ?? [] };
}

export function usePopulation(region: string) {
    const fetcher = useCallback((signal: AbortSignal) => getPopulation(region, signal), [region]);
    return useAsyncData(region ? fetcher : null);
}

export function useRealEstateTrends(region: string, housingType: HousingType) {
    const fetcher = useCallback(
        (signal: AbortSignal) => getRealEstateTrends(region, housingType, signal),
        [region, housingType],
    );
    return useAsyncData(region ? fetcher : null);
}

/** 3개 슬롯 각각의 전체 주택유형 실거래가 추이 */
export function useSlotRealEstateTrends(slots: RegionSlot[]) {
    const [a, b, c] = slots;
    const trendsA = useRealEstateTrends(a.region, 'ALL').data;
    const trendsB = useRealEstateTrends(b.region, 'ALL').data;
    const trendsC = useRealEstateTrends(c.region, 'ALL').data;
    return { A: trendsA ?? [], B: trendsB ?? [], C: trendsC ?? [] };
}
