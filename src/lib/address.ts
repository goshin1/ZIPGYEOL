export interface ParsedRegion {
    /** 화면 표시용 이름 (예: '강남구', '고양시 덕양구') */
    name: string;
    /** DB 조회용 전체 이름 (예: '서울특별시 강남구') */
    region: string;
}

const SIDO_SUFFIXES = ['특별자치시', '특별자치도', '특별시', '광역시', '도'];
const SIGUNGU_SUFFIXES = ['시', '군', '구'];

/**
 * 지번/도로명 주소에서 시·도 + 시·군·구 부분만 추출한다.
 *   '서울특별시 강남구 역삼동 737'    → { name: '강남구', region: '서울특별시 강남구' }
 *   '경기도 고양시 덕양구 화정동 1'   → { name: '고양시 덕양구', region: '경기도 고양시 덕양구' }
 *   '세종특별자치시 조치원읍 원리 1'  → { name: '세종특별자치시', region: '세종특별자치시' }
 */
export function parseRegion(address: string): ParsedRegion | null {
    const tokens = address.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return null;

    let index = 0;
    const sido = SIDO_SUFFIXES.some((suffix) => tokens[0].endsWith(suffix)) ? tokens[index++] : null;

    const sigungu: string[] = [];
    while (index < tokens.length && SIGUNGU_SUFFIXES.some((suffix) => tokens[index].endsWith(suffix))) {
        sigungu.push(tokens[index++]);
    }

    if (!sido && sigungu.length === 0) return null;

    const name = sigungu.length > 0 ? sigungu.join(' ') : sido!;
    const region = [sido, ...sigungu].filter(Boolean).join(' ');
    return { name, region };
}
