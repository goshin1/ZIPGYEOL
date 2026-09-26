import { supabase } from '@/lib/supabase';
import type { HousingType, RealEstateTrend } from '@/types';

interface RealEstateTrendRow {
    // RPC 버전에 따라 월 필드명이 다름
    deal_month?: string;
    deal_year_month?: string;
    avg_price: number | string;
    deal_count?: number | string;
}

export async function getRealEstateTrends(
    region: string,
    housingType: HousingType,
    signal?: AbortSignal,
): Promise<RealEstateTrend[]> {
    let query = supabase.rpc('get_real_estate_trends', {
        sigungu_input: region,
        housing_type_input: housingType,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as RealEstateTrendRow[]).map((row) => ({
        deal_month: row.deal_month ?? row.deal_year_month ?? '',
        avg_price: Number(row.avg_price),
        deal_count: Number(row.deal_count ?? 1),
    }));
}
