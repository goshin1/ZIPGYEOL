import { boundaryFileOf, findBoundaryAt } from '@/lib/regionBoundary';
import type { BoundaryCollection, BoundaryFeature, RegionEntry } from '@/types';

/** 행정구역 검색 목록 (정적 파일, scripts/build-regions.mjs 생성) */
export async function getRegionList(signal?: AbortSignal): Promise<RegionEntry[]> {
    const response = await fetch('/geojson/regions.json', { signal });
    if (!response.ok) throw new Error(`지역 목록을 불러오지 못했습니다. (${response.status})`);
    return (await response.json()) as RegionEntry[];
}

/**
 * 경계 파일은 슬롯 3개가 같은 파일을 쓰는 경우가 많아 파일 단위로 한 번만 받는다.
 * 여러 곳이 같은 요청을 나눠 쓰므로 abort signal은 넘기지 않는다 (결과 무시는 useAsyncData가 한다).
 */
const boundaryFileCache = new Map<string, Promise<BoundaryCollection>>();

function getBoundaryFile(file: string): Promise<BoundaryCollection> {
    let request = boundaryFileCache.get(file);
    if (!request) {
        request = fetch(`/geojson/${file}`).then(async (response) => {
            if (!response.ok) throw new Error(`경계 정보를 불러오지 못했습니다. (${response.status})`);
            return (await response.json()) as BoundaryCollection;
        });
        // 실패한 요청은 캐시에서 빼서 다음에 다시 시도할 수 있게 한다
        request.catch(() => boundaryFileCache.delete(file));
        boundaryFileCache.set(file, request);
    }
    return request;
}

/** 행정구역 코드의 경계 (코드 형식이 다르거나 파일에 없으면 null) */
export async function getBoundary(code: string): Promise<BoundaryFeature | null> {
    const file = boundaryFileOf(code);
    if (!file) return null;
    const { features } = await getBoundaryFile(file);
    return features.find((feature) => feature.properties.code === code) ?? null;
}

/** 좌표가 들어 있는 시군구 경계 (주소 검색 결과를 검색 목록의 지역과 맞출 때 쓴다) */
export async function findSigunguBoundaryAt(lat: number, lng: number): Promise<BoundaryFeature | null> {
    const { features } = await getBoundaryFile('sgg.geojson');
    return findBoundaryAt(features, lat, lng);
}
