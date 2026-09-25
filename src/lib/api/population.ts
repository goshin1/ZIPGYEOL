import { supabase } from '@/lib/supabase';
import type { PopulationRow } from '@/types';

/** 지역 인구 조회. 여러 행이 오면 첫 행을 사용한다. */
export async function getPopulation(region: string, signal?: AbortSignal): Promise<PopulationRow | null> {
    let query = supabase.rpc('get_population_by_region', { region_name: region });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as PopulationRow[])[0] ?? null;
}
