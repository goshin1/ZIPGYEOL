'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { supabase } from '@/lib/supabase';
import { Building2, Trees, Landmark, School, Hospital, Train, Store } from 'lucide-react';

interface LayerToggle {
    id: string;
    label: string;
    icon: any;
    enabled: boolean;
    color: string;
}

export default function VWorldMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const vectorSourceRef = useRef<VectorSource>(new VectorSource());

    // 초기 지도 생성 시 발생하는 가짜 moveend 이벤트를 막기 위한 플래그
    const isInitialRender = useRef<boolean>(true);

    const [facilities, setFacilities] = useState<any[]>([]);
    const [layers, setLayers] = useState<LayerToggle[]>([
        { id: 'APT', label: '아파트', icon: Building2, enabled: true, color: '#2563eb' },
        { id: 'PARK', label: '공원', icon: Trees, enabled: true, color: '#16a34a' },
        { id: 'GOV', label: '공공기관', icon: Landmark, enabled: true, color: '#9333ea' },
        { id: 'SCHOOL', label: '학교', icon: School, enabled: false, color: '#ea580c' },
        { id: 'HOSPITAL', label: '병원', icon: Hospital, enabled: true, color: '#dc2626' },
        { id: 'SUBWAY', label: '지하철/교통', icon: Train, enabled: true, color: '#0284c7' },
        { id: 'STORE', label: '편의시설', icon: Store, enabled: false, color: '#ca8a04' },
    ]);

    // 1. Supabase RPC 호출
    const fetchNearbyFacilities = useCallback(async (lat: number, lng: number) => {
        console.log(`[Supabase 요청 좌표] 위도(lat): ${lat}, 경도(lng): ${lng}`);

        try {
            const { data, error } = await supabase.rpc('get_nearby_facilities', {
                lat_input: Number(lat),
                lng_input: Number(lng),
                radius_meters: 2000 // 2km
            });

            if (error) {
                console.error('Supabase RPC Error:', error);
                return;
            }

            console.log('[Supabase 응답 데이터]:', data);

            if (data) {
                if (data.length > 0) {
                    console.log(`✅ ${data.length}개의 시설 데이터를 가져왔습니다!`);
                } else {
                    console.log('⚠️ 반경 내에 해당하는 시설 데이터가 없습니다.');
                }
                setFacilities(data);
            }
        } catch (err) {
            console.error('Data Fetching Failed:', err);
        }
    }, []);

    // 2. OpenLayers 지도 초기화
    useEffect(() => {
        if (!mapRef.current) return;

        const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

        // VWORLD WMTS 타일 레이어
        const vworldBaseLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
                crossOrigin: 'anonymous',
            }),
        });

        // 마커 Vector Layer
        const markerVectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
        });

        // 가평 참전비 공원 부근 좌표 [경도(lng), 위도(lat)]
        const initialCenter = [127.5163, 37.8257];

        const map = new Map({
            target: mapRef.current,
            layers: [vworldBaseLayer, markerVectorLayer],
            view: new View({
                center: fromLonLat(initialCenter),
                zoom: 14,
            }),
        });

        mapInstanceRef.current = map;

        // 초기 데이터 수동 호출 (위도: 37.8257, 경도: 127.5163)
        fetchNearbyFacilities(initialCenter[1], initialCenter[0]);

        // 지도 이동 및 드래그 완료 이벤트
        let timer: NodeJS.Timeout;
        map.on('moveend', () => {
            // 렌더링 시 자동 발생하는 첫 번째 moveend 무시
            if (isInitialRender.current) {
                isInitialRender.current = false;
                return;
            }

            // 0.3초 디바운싱 적용
            clearTimeout(timer);
            timer = setTimeout(() => {
                const view = map.getView();
                const center = view.getCenter();
                if (center) {
                    const [lng, lat] = toLonLat(center);
                    fetchNearbyFacilities(lat, lng);
                }
            }, 300);
        });

        return () => {
            clearTimeout(timer);
            map.setTarget(undefined);
        };
    }, [fetchNearbyFacilities]);

    // 3. facilities 데이터 기반으로 마커 랜더링
    useEffect(() => {
        const vectorSource = vectorSourceRef.current;
        vectorSource.clear();

        const enabledTypes = layers.filter((l) => l.enabled).map((l) => l.id);

        facilities.forEach((item) => {
            if (!enabledTypes.includes(item.facility_type)) return;

            const layerConfig = layers.find((l) => l.id === item.facility_type);
            const markerColor = layerConfig?.color || '#3b82f6';

            const feature = new Feature({
                geometry: new Point(fromLonLat([Number(item.lng), Number(item.lat)])),
                name: item.name,
                type: item.facility_type,
                distance: item.distance_meters,
            });

            feature.setStyle(
                new Style({
                    image: new CircleStyle({
                        radius: 8,
                        fill: new Fill({ color: markerColor }),
                        stroke: new Stroke({ color: '#ffffff', width: 2 }),
                    }),
                    text: new Text({
                        text: item.name,
                        offsetY: -14,
                        font: 'bold 11px sans-serif',
                        fill: new Fill({ color: '#1e293b' }),
                        stroke: new Stroke({ color: '#ffffff', width: 2 }),
                    }),
                })
            );

            vectorSource.addFeature(feature);
        });
    }, [facilities, layers]);

    const toggleLayer = (id: string) => {
        setLayers((prev) =>
            prev.map((layer) => (layer.id === id ? { ...layer, enabled: !layer.enabled } : layer))
        );
    };

    return (
        <div className="relative w-full h-full">
            {/* OpenLayers Map Canvas */}
            <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />

            {/* 상단 오버레이 - 선택 지역 칩 */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 px-2">지역 선택</span>
                <div className="flex gap-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm">
            <span className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px]">A</span>
            가평 참전비공원
          </span>
                </div>
            </div>

            {/* 좌측 레이어 토글 패널 */}
            <div className="absolute top-20 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 w-44">
                <h3 className="text-xs font-bold text-slate-700 mb-2.5">주변 환경 레이어</h3>
                <div className="space-y-2">
                    {layers.map((layer) => {
                        const IconComponent = layer.icon;
                        return (
                            <div key={layer.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <IconComponent className="w-3.5 h-3.5" style={{ color: layer.color }} />
                                    <span>{layer.label}</span>
                                </div>
                                <button
                                    onClick={() => toggleLayer(layer.id)}
                                    className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                                        layer.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                                    }`}
                                >
                                    <span className="w-3 h-3 bg-white rounded-full shadow-md" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}