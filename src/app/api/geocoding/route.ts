import type { NextRequest } from 'next/server';
import type { GeocodeResult } from '@/lib/api/geocoding';

const VWORLD_SEARCH_URL = 'https://api.vworld.kr/req/search';

interface VWorldSearchResponse {
    response?: {
        status?: 'OK' | 'NOT_FOUND' | 'ERROR';
        error?: { text?: string };
        result?: {
            items?: {
                title?: string;
                address?: { parcel?: string; road?: string };
                point?: { x: string; y: string };
            }[];
        };
    };
}

// VWorld 주소 검색 프록시: API 키를 서버에서만 붙여서 호출한다
export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('query')?.trim();
    if (!query) {
        return Response.json({ error: '검색어를 입력해 주세요.' }, { status: 400 });
    }

    // 지도 타일은 브라우저에서 키가 필요해 NEXT_PUBLIC_ 키를 쓰므로, 서버 전용 키가 없으면 그것을 사용
    const apiKey = process.env.VWORLD_API_KEY ?? process.env.NEXT_PUBLIC_VWORLD_API_KEY;
    if (!apiKey) {
        return Response.json({ error: 'VWorld API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const params = new URLSearchParams({
        service: 'search',
        request: 'search',
        version: '2.0',
        crs: 'EPSG:4326',
        size: '1',
        page: '1',
        query,
        type: 'ADDRESS',
        category: 'PARCEL',
        format: 'json',
        errorformat: 'json',
        key: apiKey,
    });

    try {
        const upstream = await fetch(`${VWORLD_SEARCH_URL}?${params}`);
        const data = (await upstream.json()) as VWorldSearchResponse;

        if (data.response?.status === 'ERROR') {
            return Response.json({ error: `API 오류: ${data.response.error?.text ?? '검색 실패'}` }, { status: 502 });
        }

        const item = data.response?.result?.items?.[0];
        if (!item?.point) {
            return Response.json({ result: null });
        }

        const result: GeocodeResult = {
            lat: parseFloat(item.point.y),
            lng: parseFloat(item.point.x),
            address: item.address?.parcel || item.address?.road || item.title || query,
        };
        return Response.json({ result });
    } catch (error) {
        console.error('VWorld Geocoding API Error:', error);
        return Response.json({ error: '검색 처리 중 오류가 발생했습니다.' }, { status: 502 });
    }
}
