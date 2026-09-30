import type { ParsedRegion } from '@/lib/address';
import type { RegionEntry, RegionLevel, RegionNames } from '@/types';

export const MAX_SUGGESTIONS = 10;

export const REGION_LEVEL_LABELS: Record<RegionLevel, string> = { sido: '시도', sgg: '시군구', emd: '읍면동' };

const LEVEL_ORDER: Record<RegionLevel, number> = { sido: 0, sgg: 1, emd: 2 };

/** 정식 명칭에 들어 있지 않은 시도 약칭 ('서울', '경기'처럼 명칭의 일부인 약칭은 없어도 찾힌다) */
const SIDO_ALIASES: Record<string, string[]> = {
    충청북도: ['충북'],
    충청남도: ['충남'],
    경상북도: ['경북'],
    경상남도: ['경남'],
    전북특별자치도: ['전북'],
};

/** 이름 끝의 행정구역 접미어 ('강남구' → '강남') */
const ADMIN_SUFFIX = /(특별자치시|특별자치도|통합특별시|특별시|광역시|도|시|군|구|읍|면|동)$/;

/** 검색어 끝의 완성되지 않은 한글 자모 */
const INCOMPLETE_JAMO = /[ㄱ-ㆎ]+$/;

export function regionLevel(entry: RegionNames): RegionLevel {
    if (entry.emd) return 'emd';
    return entry.sigungu ? 'sgg' : 'sido';
}

/** '수원시장안구' → '수원시 장안구' (DB, 화면 표기와 맞춤) */
export function formatSigungu(sigungu: string): string {
    return sigungu.replace(/^(\S+시)(\S+구)$/, '$1 $2');
}

/** 지역 자신의 이름 (예: '역삼1동', '수원시 장안구', '서울특별시') */
export function regionName(entry: RegionNames): string {
    return entry.emd || formatSigungu(entry.sigungu) || entry.sido;
}

/** 상위 지역 경로 (예: 역삼1동 → '서울특별시 강남구', 시도는 빈 문자열) */
export function regionParentLabel(entry: RegionNames): string {
    if (entry.emd) return `${entry.sido} ${formatSigungu(entry.sigungu)}`;
    return entry.sigungu ? entry.sido : '';
}

/**
 * 슬롯에 넣을 이름과 DB 조회용 지역.
 * 인구/실거래가는 시군구까지만 있어서 읍면동을 골라도 조회는 상위 시군구로 한다.
 */
export function toSlotRegion(entry: RegionNames): ParsedRegion {
    return {
        name: regionName(entry),
        region: [entry.sido, formatSigungu(entry.sigungu)].filter(Boolean).join(' '),
    };
}

/** 검색어 토큰이 지역 자신의 이름과 얼마나 맞는지 (작을수록 우선) */
function nameRank(names: string[], token: string): number {
    let best = 3; // 상위 지역 이름으로만 맞음
    for (const name of names) {
        if (name === token || name.replace(ADMIN_SUFFIX, '') === token) return 0;
        if (name.startsWith(token)) best = Math.min(best, 1);
        else if (name.includes(token)) best = Math.min(best, 2);
    }
    return best;
}

/**
 * 검색 목록으로 검색 함수를 만든다. 비교용 문자열은 여기서 한 번만 만든다.
 *
 * - 매칭: 검색어를 공백으로 나눈 토큰이 모두 '시도+시군구+읍면동'(공백 없음)에 들어 있으면 후보
 *   ('수원 장안', '서울 강남 역삼', '경북 포항'이 모두 찾힌다)
 * - 정렬: 마지막 토큰이 지역 자신의 이름과 맞는 정도 → 시도 > 시군구 > 읍면동 → 목록 순서
 */
export function createRegionSearch(entries: RegionEntry[]) {
    const indexed = entries.map((entry) => {
        const level = regionLevel(entry);
        const sidoNames = [entry.sido, ...(SIDO_ALIASES[entry.sido] ?? [])];
        return {
            entry,
            levelOrder: LEVEL_ORDER[level],
            haystacks: sidoNames.map((sido) => sido + entry.sigungu + entry.emd),
            // 시군구는 '수원시', '장안구'로 나눠 비교해야 '장안'이 앞부분 일치가 된다
            ownNames:
                level === 'emd' ? [entry.emd] : level === 'sgg' ? formatSigungu(entry.sigungu).split(' ') : sidoNames,
        };
    });

    return function searchRegions(query: string, limit = MAX_SUGGESTIONS): RegionEntry[] {
        // 한글 조합 중인 끝 자모('역ㅅ'의 'ㅅ')는 떼고 찾는다. 두지 않으면 글자를 칠 때마다 결과가 0건으로 깜빡인다
        const tokens = query.replace(INCOMPLETE_JAMO, '').trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return [];
        const lastToken = tokens.at(-1)!;

        return indexed
            .filter(({ haystacks }) => haystacks.some((haystack) => tokens.every((token) => haystack.includes(token))))
            .map((item) => ({ item, rank: nameRank(item.ownNames, lastToken) }))
            .sort((a, b) => a.rank - b.rank || a.item.levelOrder - b.item.levelOrder)
            .slice(0, limit)
            .map(({ item }) => item.entry);
    };
}

export type RegionSearch = ReturnType<typeof createRegionSearch>;
