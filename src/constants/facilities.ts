import { Hospital, type LucideIcon, Pill, Train, Trees } from 'lucide-react';

interface FacilityTypeConfig {
    /** 목록·레이어 표시 이름 */
    label: string;
    /** 점수 차트 축 이름 */
    scoreLabel: string;
    /** 지도 마커·레이어 아이콘 색 */
    color: string;
    icon: LucideIcon;
    /** 상세 패널 카드 배경/테두리 스타일 */
    badgeClass: string;
    /** 이 개수 이상이면 100점 (반경 내 기대 최대치) */
    maxExpected: number;
}

/**
 * 화면에 표출하는 시설 카테고리의 단일 정의.
 * 카테고리를 추가/수정할 때는 이 객체만 바꾸면 지도·상세·비교 패널에 모두 반영된다.
 */
export const FACILITY_TYPES = {
    PARK: {
        label: '공원',
        scoreLabel: '녹지',
        color: '#16a34a',
        icon: Trees,
        badgeClass:
            'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
        maxExpected: 8,
    },
    HOSPITAL: {
        label: '병원',
        scoreLabel: '의료',
        color: '#dc2626',
        icon: Hospital,
        badgeClass: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/60',
        maxExpected: 6,
    },
    PHARMACY: {
        label: '약국',
        scoreLabel: '약국',
        color: '#ec4899',
        icon: Pill,
        badgeClass:
            'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800/60',
        maxExpected: 10,
    },
    SUBWAY: {
        label: '지하철',
        scoreLabel: '교통',
        color: '#0284c7',
        icon: Train,
        badgeClass: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/60',
        maxExpected: 5,
    },
} as const satisfies Record<string, FacilityTypeConfig>;

export type FacilityType = keyof typeof FACILITY_TYPES;

/** 표시 순서가 보장된 카테고리 키 목록 */
export const FACILITY_TYPE_KEYS = Object.keys(FACILITY_TYPES) as FacilityType[];

export function isFacilityType(value: string): value is FacilityType {
    return value in FACILITY_TYPES;
}

/** 주변 시설 조회 반경 (m) */
export const NEARBY_RADIUS_METERS = 2000;
