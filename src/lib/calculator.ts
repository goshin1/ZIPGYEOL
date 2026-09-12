export interface FacilityItem {
    id: number;
    name: string;
    facility_type: string;
    lat: number;
    lng: number;
    distance_meters: number;
}

export interface EnvironmentScores {
    category: string;
    score: number;
}

export function calculateEnvironmentScores(facilities: FacilityItem[]) {
    // 카테고리별 개수 집계
    const counts = {
        SUBWAY: facilities.filter((f) => f.facility_type === 'SUBWAY').length,
        PARK: facilities.filter((f) => f.facility_type === 'PARK').length,
        HOSPITAL: facilities.filter((f) => f.facility_type === 'HOSPITAL').length,
        SCHOOL: facilities.filter((f) => f.facility_type === 'SCHOOL').length,
        STORE: facilities.filter((f) => f.facility_type === 'STORE' || f.facility_type === 'GOV').length,
    };

    // 개수 기준 100점 만점 상대/절대 정량 점수 환산 (상한선 기준)
    return [
        { category: '교통 접근성', score: Math.min(counts.SUBWAY * 25 + 20, 100) },
        { category: '공원/녹지', score: Math.min(counts.PARK * 20 + 30, 100) },
        { category: '의료 시설', score: Math.min(counts.HOSPITAL * 15 + 20, 100) },
        { category: '교육 환경', score: Math.min(counts.SCHOOL * 20 + 20, 100) },
        { category: '편의 시설', score: Math.min(counts.STORE * 15 + 25, 100) },
    ];
}