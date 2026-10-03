import { useCallback, useSyncExternalStore } from 'react';
import type { FacilityType } from '@/constants/facilities';
import { DEFAULT_WEIGHTS, type InfraWeights } from '@/constants/weights';
import { sanitizeWeights } from '@/lib/scores';

// 사용자별 인프라 가중치. 로그인이 없어 브라우저(localStorage)에 저장한다.
// 계정 기능이 생기면 readStored/writeStored만 바꾸면 된다.

const STORAGE_KEY = 'infra-weights';

function readStored(): InfraWeights {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? sanitizeWeights(JSON.parse(raw)) : DEFAULT_WEIGHTS;
    } catch {
        return DEFAULT_WEIGHTS;
    }
}

function writeStored(weights: InfraWeights) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
    } catch {
        // 저장소 접근이 막힌 환경(시크릿 모드 등)에서는 이번 세션에만 유지
    }
}

// useSyncExternalStore는 같은 값이면 같은 참조를 돌려줘야 하므로 모듈 단위로 캐시한다
let current: InfraWeights | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    return () => listeners.delete(onChange);
}

const getSnapshot = () => (current ??= readStored());
const getServerSnapshot = () => DEFAULT_WEIGHTS;

function setWeights(next: InfraWeights) {
    current = next;
    writeStored(next);
    listeners.forEach((listener) => listener());
}

export function useInfraWeights() {
    const weights = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const setWeight = useCallback((type: FacilityType, value: number) => {
        setWeights(sanitizeWeights({ ...getSnapshot(), [type]: value }));
    }, []);

    const applyWeights = useCallback((next: InfraWeights) => setWeights(sanitizeWeights(next)), []);

    return { weights, setWeight, applyWeights };
}
