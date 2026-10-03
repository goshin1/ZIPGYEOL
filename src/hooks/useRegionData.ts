import { useCallback } from 'react';
import { getNearbyFacilities } from '@/lib/api/facilities';
import { getPopulation } from '@/lib/api/population';
import { getRealEstateTrends } from '@/lib/api/realEstate';
import type { Facility, HousingType, RealEstateTrend, RegionSlot, SlotRecord } from '@/types';
import { useAsyncData } from './useAsyncData';

// 지역 단위 데이터 조회 훅 모음. 컴포넌트는 이 훅만 쓰고 Supabase를 직접 호출하지 않는다.

export function useNearbyFacilities(lat: number, lng: number) {
    const fetcher = useCallback((signal: AbortSignal) => getNearbyFacilities(lat, lng, signal), [lat, lng]);
    return useAsyncData(fetcher);
}

/** 슬롯 3개에 대한 조회 결과 (값이 없으면 빈 배열) */
export interface SlotData<T> {
    data: SlotRecord<T>;
    loading: SlotRecord<boolean>;
}

/** 3개 슬롯 각각의 좌표 기준 주변 시설 (슬롯 개수가 고정이라 훅을 명시적으로 3번 호출) */
export function useSlotFacilities(slots: RegionSlot[]): SlotData<Facility[]> {
    const [a, b, c] = slots;
    const facilitiesA = useNearbyFacilities(a.lat, a.lng);
    const facilitiesB = useNearbyFacilities(b.lat, b.lng);
    const facilitiesC = useNearbyFacilities(c.lat, c.lng);
    return {
        data: { A: facilitiesA.data ?? [], B: facilitiesB.data ?? [], C: facilitiesC.data ?? [] },
        loading: { A: facilitiesA.loading, B: facilitiesB.loading, C: facilitiesC.loading },
    };
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
export function useSlotRealEstateTrends(slots: RegionSlot[]): SlotData<RealEstateTrend[]> {
    const [a, b, c] = slots;
    const trendsA = useRealEstateTrends(a.region, 'ALL');
    const trendsB = useRealEstateTrends(b.region, 'ALL');
    const trendsC = useRealEstateTrends(c.region, 'ALL');
    return {
        data: { A: trendsA.data ?? [], B: trendsB.data ?? [], C: trendsC.data ?? [] },
        loading: { A: trendsA.loading, B: trendsB.loading, C: trendsC.loading },
    };
}
