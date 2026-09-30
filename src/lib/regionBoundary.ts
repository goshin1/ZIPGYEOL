import type { BoundaryFeature, BoundaryGeometry, RegionNames } from '@/types';

/**
 * 행정구역 코드 → 경계가 들어 있는 파일 (public/geojson 기준 경로).
 * 행정동은 용량 때문에 시도별로 나뉘어 있어서 코드 앞 2자리(시도)로 고른다.
 */
export function boundaryFileOf(code: string): string | null {
    if (/^\d{2}$/.test(code)) return 'sido.geojson';
    if (/^\d{5}$/.test(code)) return 'sgg.geojson';
    if (/^\d{10}$/.test(code)) return `hjd/${code.slice(0, 2)}.geojson`;
    return null;
}

/** 경계 feature의 key('시도|시군구|읍면동') → 이름 */
export function parseBoundaryKey(key: string): RegionNames {
    const [sido = '', sigungu = '', emd = ''] = key.split('|');
    return { sido, sigungu, emd };
}

/** 고리(ring) 안에 점이 있는지 (ray casting, 경계선 위는 어느 쪽이든 상관없다) */
function ringContains(ring: number[][], lng: number, lat: number): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}

/** 폴리곤 = [외곽, ...구멍]. 외곽 안이면서 어느 구멍에도 없어야 포함 */
function polygonContains(rings: number[][][], lng: number, lat: number): boolean {
    const [outer, ...holes] = rings;
    return ringContains(outer, lng, lat) && !holes.some((hole) => ringContains(hole, lng, lat));
}

export function geometryContains(geometry: BoundaryGeometry, lng: number, lat: number): boolean {
    return geometry.type === 'Polygon'
        ? polygonContains(geometry.coordinates, lng, lat)
        : geometry.coordinates.some((polygon) => polygonContains(polygon, lng, lat));
}

/** 좌표가 들어 있는 경계 (없으면 null, 바다 위 좌표 등) */
export function findBoundaryAt(features: BoundaryFeature[], lat: number, lng: number): BoundaryFeature | null {
    return features.find((feature) => geometryContains(feature.geometry, lng, lat)) ?? null;
}
