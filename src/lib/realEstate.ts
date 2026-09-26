import type { RealEstateTrend } from '@/types';

export interface YearlyPrice {
    year: string;
    /** 거래 건수로 가중 평균한 연 평균 매매가 (만원) */
    avgPrice: number;
}

/** 월별 집계를 연도별 가중 평균으로 합친다 */
export function toYearlyAverage(trends: RealEstateTrend[]): YearlyPrice[] {
    const byYear = new Map<string, { total: number; count: number }>();
    for (const { deal_month, avg_price, deal_count } of trends) {
        const year = deal_month.slice(0, 4);
        const acc = byYear.get(year) ?? { total: 0, count: 0 };
        acc.total += avg_price * deal_count;
        acc.count += deal_count;
        byYear.set(year, acc);
    }
    return [...byYear.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, { total, count }]) => ({ year, avgPrice: count > 0 ? total / count : 0 }));
}

/** 만원 → 억원 */
export function manwonToEok(manwon: number): number {
    return manwon / 10000;
}
