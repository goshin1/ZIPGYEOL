// 앱 전역에서 공유하는 도메인 타입 모음

/** 비교 슬롯 식별자 (지역 비교는 A/B/C 3개 고정) */
export type SlotId = 'A' | 'B' | 'C';

/** 슬롯 id를 키로 하는 객체 (예: 슬롯별 시설 목록) */
export type SlotRecord<T> = Record<SlotId, T>;

/** 비교 대상 지역 하나 */
export interface RegionSlot {
    id: SlotId;
    /** 화면 표시용 짧은 이름 (예: '강남구', '고양시 덕양구') */
    name: string;
    /** DB 조회용 행정구역 전체 이름 (예: '서울특별시 강남구') */
    region: string;
    lat: number;
    lng: number;
    color: string;
}

/** 주변 시설 (get_nearby_facilities RPC 결과를 정규화한 형태) */
export interface Facility {
    id: number;
    name: string;
    facility_type: string;
    lat: number;
    lng: number;
    distance_meters: number;
}

/** 연령대별 인구 (get_population_by_region RPC 결과) */
export interface PopulationRow {
    region_raw: string;
    total_pop: number;
    age_0_9: number;
    age_10_19: number;
    age_20_29: number;
    age_30_39: number;
    age_40_49: number;
    age_50_59: number;
    age_60_69: number;
    age_70_79: number;
    age_80_89: number;
    age_90_99: number;
    age_100_plus: number;
}

/** 월별 실거래가 집계 (get_real_estate_trends RPC 결과를 정규화한 형태, 가격 단위: 만원) */
export interface RealEstateTrend {
    deal_month: string;
    avg_price: number;
    deal_count: number;
}

export type HousingType = 'ALL' | '아파트' | '연립다세대' | '단독다가구';

/** 모바일 하단 탭 */
export type MobileTab = 'map' | 'details' | 'compare';
