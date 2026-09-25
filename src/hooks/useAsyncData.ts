import { useEffect, useState } from 'react';

export type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

export interface AsyncState<T> {
    data: T | null;
    error: Error | null;
    loading: boolean;
}

/**
 * 비동기 조회 공통 훅.
 * - fetcher가 바뀌면 이전 요청을 abort 하고 새로 조회한다 (경쟁 상태 방지)
 * - fetcher는 호출하는 쪽에서 useCallback으로 고정해야 한다
 * - fetcher가 null이면 조회하지 않는다
 */
export function useAsyncData<T>(fetcher: Fetcher<T> | null): AsyncState<T> {
    // 결과를 "어떤 fetcher의 결과인지"와 함께 저장해서, loading 여부를 별도 state 없이 계산한다
    const [result, setResult] = useState<{ fetcher: Fetcher<T>; data: T | null; error: Error | null } | null>(null);

    useEffect(() => {
        if (!fetcher) return;
        const controller = new AbortController();

        fetcher(controller.signal).then(
            (data) => {
                if (!controller.signal.aborted) setResult({ fetcher, data, error: null });
            },
            (error: unknown) => {
                if (controller.signal.aborted) return;
                console.error(error);
                const normalized = error instanceof Error ? error : new Error(String(error));
                setResult({ fetcher, data: null, error: normalized });
            },
        );

        return () => controller.abort();
    }, [fetcher]);

    if (!fetcher) return { data: null, error: null, loading: false };
    if (result?.fetcher !== fetcher) return { data: null, error: null, loading: true };
    return { data: result.data, error: result.error, loading: false };
}
