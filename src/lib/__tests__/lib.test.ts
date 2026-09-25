import { describe, expect, it } from 'vitest';
import { parseRegion } from '@/lib/address';
import { toYearlyAverage } from '@/lib/realEstate';
import { calculateScores, countByType, toScore } from '@/lib/scores';
import type { Facility } from '@/types';

const facility = (facility_type: string): Facility => ({
    id: 1,
    name: 'test',
    facility_type,
    lat: 0,
    lng: 0,
    distance_meters: 0,
});

describe('parseRegion', () => {
    it('광역시/특별시의 구를 추출한다', () => {
        expect(parseRegion('서울특별시 강남구 역삼동 737')).toEqual({ name: '강남구', region: '서울특별시 강남구' });
        expect(parseRegion('부산광역시 중구 중앙동 1')).toEqual({ name: '중구', region: '부산광역시 중구' });
    });

    it('도 아래의 시+구를 함께 추출한다', () => {
        expect(parseRegion('경기도 고양시 덕양구 화정동 1')).toEqual({
            name: '고양시 덕양구',
            region: '경기도 고양시 덕양구',
        });
        expect(parseRegion('경기도 가평군 가평읍 읍내리 1')).toEqual({ name: '가평군', region: '경기도 가평군' });
    });

    it('시·군·구가 없는 특별자치시는 시 이름을 쓴다', () => {
        expect(parseRegion('세종특별자치시 조치원읍 원리 1')).toEqual({
            name: '세종특별자치시',
            region: '세종특별자치시',
        });
    });

    it('행정구역을 찾을 수 없으면 null', () => {
        expect(parseRegion('')).toBeNull();
        expect(parseRegion('테헤란로 152')).toBeNull();
    });
});

describe('scores', () => {
    it('표출 대상 카테고리만 집계한다', () => {
        const counts = countByType([facility('PARK'), facility('PARK'), facility('SUBWAY'), facility('GOV')]);
        expect(counts).toEqual({ PARK: 2, HOSPITAL: 0, PHARMACY: 0, SUBWAY: 1 });
    });

    it('기대 최대치를 넘으면 100점으로 제한한다', () => {
        expect(toScore(4, 8)).toBe(50);
        expect(toScore(20, 8)).toBe(100);
    });

    it('카테고리별 점수를 계산한다', () => {
        expect(calculateScores({ PARK: 4, HOSPITAL: 6, PHARMACY: 0, SUBWAY: 1 })).toEqual({
            PARK: 50,
            HOSPITAL: 100,
            PHARMACY: 0,
            SUBWAY: 20,
        });
    });
});

describe('toYearlyAverage', () => {
    it('거래 건수로 가중 평균한다', () => {
        const result = toYearlyAverage([
            { deal_month: '2023-02', avg_price: 300, deal_count: 1 },
            { deal_month: '2022-01', avg_price: 100, deal_count: 1 },
            { deal_month: '2022-02', avg_price: 200, deal_count: 3 },
        ]);
        expect(result).toEqual([
            { year: '2022', avgPrice: 175 },
            { year: '2023', avgPrice: 300 },
        ]);
    });
});
