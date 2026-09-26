export interface GeocodeResult {
    lat: number;
    lng: number;
    address: string;
}

/** 주소 검색 (서버 Route Handler `/api/geocoding` 경유) */
export async function searchAddress(query: string): Promise<GeocodeResult | null> {
    const response = await fetch(`/api/geocoding?query=${encodeURIComponent(query)}`);
    const body = (await response.json()) as { result?: GeocodeResult | null; error?: string };

    if (!response.ok) throw new Error(body.error ?? '검색 실패');
    return body.result ?? null;
}
