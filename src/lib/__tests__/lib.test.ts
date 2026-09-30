import { describe, expect, it } from 'vitest';
import { parseRegion } from '@/lib/address';
import { createRegionSearch, regionName, regionParentLabel, toSlotRegion } from '@/lib/regionSearch';
import { toYearlyAverage } from '@/lib/realEstate';
import { boundaryFileOf, findBoundaryAt, geometryContains, parseBoundaryKey } from '@/lib/regionBoundary';
import { calculateScores, countByType, toScore } from '@/lib/scores';
import type { BoundaryFeature, BoundaryGeometry, Facility, RegionEntry } from '@/types';

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

describe('regionSearch', () => {
    const entry = (sido: string, sigungu = '', emd = ''): RegionEntry => ({
        sido,
        sigungu,
        emd,
        lat: 0,
        lng: 0,
        code: [sido, sigungu, emd].join('|'),
    });
    const REGIONS = [
        entry('서울특별시'),
        entry('경기도'),
        entry('경상북도'),
        entry('서울특별시', '강남구'),
        entry('서울특별시', '동대문구'),
        entry('경기도', '수원시장안구'),
        entry('경상북도', '포항시남구'),
        entry('서울특별시', '강남구', '역삼1동'),
        entry('서울특별시', '강남구', '역삼2동'),
        entry('서울특별시', '동대문구', '장안1동'),
        entry('경기도', '수원시장안구', '파장동'),
        entry('서울특별시', '중구', '중앙동'),
        entry('경기도', '수원시장안구', '중앙동'),
    ];
    const search = createRegionSearch(REGIONS);
    const names = (query: string) => search(query).map((r) => [r.sido, r.sigungu, r.emd].filter(Boolean).join(' '));

    it('공백으로 나눈 토큰이 모두 들어 있는 지역을 찾는다', () => {
        expect(names('수원 장안')).toEqual([
            '경기도 수원시장안구',
            '경기도 수원시장안구 파장동',
            '경기도 수원시장안구 중앙동',
        ]);
        expect(names('서울 강남 역삼')).toEqual(['서울특별시 강남구 역삼1동', '서울특별시 강남구 역삼2동']);
        expect(names('수원시 장안구')[0]).toBe('경기도 수원시장안구');
    });

    it('이름에 없는 시도 약칭도 찾는다', () => {
        expect(names('경북 포항')).toEqual(['경상북도 포항시남구']);
    });

    it('자신의 이름이 맞는 지역을 먼저, 같으면 상위 단위를 먼저 보여준다', () => {
        // '강남구'(접미어 제외 일치) → 강남구 소속 동(상위 이름으로만 일치)
        expect(names('강남')).toEqual(['서울특별시 강남구', '서울특별시 강남구 역삼1동', '서울특별시 강남구 역삼2동']);
        // 시군구 '수원시장안구'의 '장안구'와 동 '장안1동'이 둘 다 앞부분 일치 → 시군구 먼저
        expect(names('장안').slice(0, 2)).toEqual(['경기도 수원시장안구', '서울특별시 동대문구 장안1동']);
    });

    it('같은 이름의 동은 모두 보여준다', () => {
        expect(names('중앙동')).toHaveLength(2);
    });

    it('조합 중인 끝 자모는 떼고 찾는다', () => {
        expect(names('역ㅅ')).toEqual(names('역'));
        expect(search('ㅅ')).toEqual([]);
    });

    it('검색어가 비어 있거나 일치하는 지역이 없으면 빈 배열', () => {
        expect(search('   ')).toEqual([]);
        expect(search('테헤란로')).toEqual([]);
    });

    it('개수를 제한한다', () => {
        expect(search('서울', 2)).toHaveLength(2);
    });

    it('읍면동을 골라도 DB 조회 지역은 상위 시군구(띄어쓰기 맞춤)', () => {
        expect(toSlotRegion(entry('경기도', '수원시장안구', '파장동'))).toEqual({
            name: '파장동',
            region: '경기도 수원시 장안구',
        });
        expect(toSlotRegion(entry('서울특별시', '강남구'))).toEqual({ name: '강남구', region: '서울특별시 강남구' });
        expect(toSlotRegion(entry('서울특별시'))).toEqual({ name: '서울특별시', region: '서울특별시' });
    });

    it('표시용 이름과 상위 경로', () => {
        expect(regionName(entry('경기도', '수원시장안구'))).toBe('수원시 장안구');
        expect(regionParentLabel(entry('경기도', '수원시장안구', '파장동'))).toBe('경기도 수원시 장안구');
        expect(regionParentLabel(entry('경기도'))).toBe('');
    });
});

describe('regionBoundary', () => {
    // 경도 x, 위도 y 기준 정사각형 고리
    const square = (x0: number, y0: number, size: number) => [
        [x0, y0],
        [x0 + size, y0],
        [x0 + size, y0 + size],
        [x0, y0 + size],
        [x0, y0],
    ];
    // 가운데에 구멍이 뚫린 도넛 모양
    const donut: BoundaryGeometry = { type: 'Polygon', coordinates: [square(0, 0, 10), square(4, 4, 2)] };
    const islands: BoundaryGeometry = { type: 'MultiPolygon', coordinates: [[square(0, 0, 1)], [square(5, 5, 1)]] };

    it('코드 길이로 경계 파일을 고른다', () => {
        expect(boundaryFileOf('11')).toBe('sido.geojson');
        expect(boundaryFileOf('11680')).toBe('sgg.geojson');
        expect(boundaryFileOf('1168064000')).toBe('hjd/11.geojson');
        expect(boundaryFileOf('')).toBeNull();
        expect(boundaryFileOf('1168')).toBeNull();
    });

    it('경계 key를 이름으로 나눈다', () => {
        expect(parseBoundaryKey('경기도|수원시장안구|')).toEqual({ sido: '경기도', sigungu: '수원시장안구', emd: '' });
        expect(parseBoundaryKey('서울특별시||')).toEqual({ sido: '서울특별시', sigungu: '', emd: '' });
    });

    it('폴리곤 구멍 안의 점은 포함하지 않는다', () => {
        expect(geometryContains(donut, 1, 1)).toBe(true);
        expect(geometryContains(donut, 5, 5)).toBe(false);
        expect(geometryContains(donut, 11, 5)).toBe(false);
    });

    it('멀티폴리곤은 조각 중 하나에만 있어도 포함', () => {
        expect(geometryContains(islands, 5.5, 5.5)).toBe(true);
        expect(geometryContains(islands, 3, 3)).toBe(false);
    });

    it('좌표가 들어 있는 경계를 찾고, 없으면 null', () => {
        const feature = (code: string, geometry: BoundaryGeometry): BoundaryFeature => ({
            type: 'Feature',
            geometry,
            properties: { key: code, code },
        });
        const features = [feature('A', donut), feature('B', islands)];
        // findBoundaryAt(features, 위도, 경도)
        expect(findBoundaryAt(features, 1, 9)?.properties.code).toBe('A');
        expect(findBoundaryAt(features, 5.5, 5.5)?.properties.code).toBe('B');
        expect(findBoundaryAt(features, 20, 20)).toBeNull();
    });
});
