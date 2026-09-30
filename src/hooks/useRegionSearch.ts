import { useCallback } from 'react';
import { getRegionList } from '@/lib/api/regions';
import { createRegionSearch } from '@/lib/regionSearch';
import { useAsyncData } from './useAsyncData';

/**
 * 행정구역 검색 함수. 목록(약 450KB)은 enabled가 처음 true가 될 때(검색창 포커스) 받는다.
 * data는 목록이 아니라 검색 함수라서, 비교용 문자열도 목록을 받을 때 한 번만 만든다.
 */
export function useRegionSearch(enabled: boolean) {
    const fetcher = useCallback(
        (signal: AbortSignal) => getRegionList(signal).then((entries) => createRegionSearch(entries)),
        [],
    );
    return useAsyncData(enabled ? fetcher : null);
}
