import { useCallback } from 'react';
import { getBoundary } from '@/lib/api/regions';
import type { BoundaryFeature, RegionSlot, SlotRecord } from '@/types';
import { type AsyncState, useAsyncData } from './useAsyncData';

/** 행정구역 코드의 경계 (코드가 비어 있으면 조회하지 않는다) */
export function useBoundary(code: string) {
    const fetcher = useCallback(() => getBoundary(code), [code]);
    return useAsyncData(code ? fetcher : null);
}

/** 3개 슬롯 각각의 경계 (지도는 loading으로 '아직 받는 중'과 '경계 없음'을 구분한다) */
export function useSlotBoundaries(slots: RegionSlot[]): SlotRecord<AsyncState<BoundaryFeature | null>> {
    const [a, b, c] = slots;
    const boundaryA = useBoundary(a.code);
    const boundaryB = useBoundary(b.code);
    const boundaryC = useBoundary(c.code);
    return { A: boundaryA, B: boundaryB, C: boundaryC };
}
