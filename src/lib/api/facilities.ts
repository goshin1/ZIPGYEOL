import { NEARBY_RADIUS_METERS } from '@/constants/facilities';
import { supabase } from '@/lib/supabase';
import type { Facility } from '@/types';

interface NearbyFacilityRow {
    id: number;
    name: string;
    facility_type: string;
    lat: number | string;
    lng: number | string;
    // RPC 버전에 따라 거리 필드명이 다름
    distance?: number;
    distance_meters?: number;
}

export async function getNearbyFacilities(lat: number, lng: number, signal?: AbortSignal): Promise<Facility[]> {
    let query = supabase.rpc('get_nearby_facilities', {
        lat_input: lat,
        lng_input: lng,
        radius_meters: NEARBY_RADIUS_METERS,
    });
    if (signal) query = query.abortSignal(signal);

    const { data, error } = await query;
    if (error) throw error;

    return ((data ?? []) as NearbyFacilityRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        facility_type: row.facility_type,
        lat: Number(row.lat),
        lng: Number(row.lng),
        distance_meters: Number(row.distance_meters ?? row.distance ?? 0),
    }));
}
