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
import Overlay from 'ol/Overlay';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import { supabase } from '@/lib/supabase';
import { Building2, Trees, Landmark, School, Hospital, Train, Store, X } from 'lucide-react';
import { RegionSlot } from "@/app/page";

interface LayerToggle {
    id: string;
    label: string;
    icon: any;
    enabled: boolean;
    color: string;
}

interface VWorldMapProps {
    activeSlot: RegionSlot;
    slots: RegionSlot[];
    onSelectSlot: (slot: RegionSlot) => void;
    onFacilitiesFetched: (data: any[]) => void;
}

export default function VWorldMap({ activeSlot, slots, onSelectSlot, onFacilitiesFetched }: VWorldMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const overlayRef = useRef<Overlay | null>(null);
    const vectorSourceRef = useRef<VectorSource>(new VectorSource());

    // 1. 부모 콜백을 Ref로 관리하여 useEffect 재실행 방지 (무한 루프 방지 핵심)
    const onFacilitiesFetchedRef = useRef(onFacilitiesFetched);
    useEffect(() => {
        onFacilitiesFetchedRef.current = onFacilitiesFetched;
    }, [onFacilitiesFetched]);

    const isInitialRender = useRef<boolean>(true);

    const [facilities, setFacilities] = useState<any[]>([]);
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [layers, setLayers] = useState<LayerToggle[]>([
        { id: 'APT', label: '아파트', icon: Building2, enabled: true, color: '#2563eb' },
        { id: 'PARK', label: '공원', icon: Trees, enabled: true, color: '#16a34a' },
        { id: 'GOV', label: '공공기관', icon: Landmark, enabled: true, color: '#9333ea' },
        { id: 'SCHOOL', label: '학교', icon: School, enabled: false, color: '#ea580c' },
        { id: 'HOSPITAL', label: '병원', icon: Hospital, enabled: true, color: '#dc2626' },
        { id: 'SUBWAY', label: '지하철/교통', icon: Train, enabled: true, color: '#0284c7' },
        { id: 'STORE', label: '편의시설', icon: Store, enabled: false, color: '#ca8a04' },
    ]);

    // 2. Supabase RPC 호출 (의존성 배열을 완전히 비워서 재생성 방지)
    const fetchNearbyFacilities = useCallback(async (lat: number, lng: number) => {
        try {
            const { data, error } = await supabase.rpc('get_nearby_facilities', {
                lat_input: Number(lat),
                lng_input: Number(lng),
                radius_meters: 2000
            });

            if (error) {
                console.error('Supabase RPC Error:', error);
                return;
            }

            if (data) {
                setFacilities(data);
                // Ref를 통해 최신 부모 함수 호출
                onFacilitiesFetchedRef.current?.(data);
            }
        } catch (err) {
            console.error('Data Fetching Failed:', err);
        }
    }, []);

    // 3. OpenLayers 지도 초기화 (마운트 시 단 1회만 실행되도록 [] 지정)
    useEffect(() => {
        if (!mapRef.current || !popupRef.current) return;

        const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

        const overlay = new Overlay({
            element: popupRef.current,
            autoPan: { animation: { duration: 250 } },
            positioning: 'bottom-center',
            offset: [0, -15],
        });
        overlayRef.current = overlay;

        const vworldBaseLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
                crossOrigin: 'anonymous',
            }),
        });

        const markerVectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
        });

        const initialCenter = [127.5163, 37.8257];

        const map = new Map({
            target: mapRef.current,
            layers: [vworldBaseLayer, markerVectorLayer],
            overlays: [overlay],
            view: new View({
                center: fromLonLat(initialCenter),
                zoom: 14,
            }),
        });

        mapInstanceRef.current = map;

        // 최초 1회 데이터 호출
        fetchNearbyFacilities(initialCenter[1], initialCenter[0]);

        // 지도 이동 완료 이벤트
        let timer: NodeJS.Timeout;
        map.on('moveend', () => {
            if (isInitialRender.current) {
                isInitialRender.current = false;
                return;
            }

            clearTimeout(timer);
            timer = setTimeout(() => {
                const view = map.getView();
                const center = view.getCenter();
                if (center) {
                    const [lng, lat] = toLonLat(center);
                    fetchNearbyFacilities(lat, lng);
                }
            }, 400); // 디바운스 시간을 400ms로 안전하게 설정
        });

        // 마커 클릭 이벤트
        map.on('singleclick', (evt) => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);

            if (feature) {
                const geometry = feature.getGeometry() as Point;
                const coordinates = geometry.getCoordinates();
                const properties = feature.getProperties();

                setSelectedFeature(properties);
                overlay.setPosition(coordinates);
            } else {
                overlay.setPosition(undefined);
                setSelectedFeature(null);
            }
        });

        return () => {
            clearTimeout(timer);
            map.setTarget(undefined);
        };
    }, []); // 👈 의존성 배열을 [] 로 설정하여 지도가 절대 재초기화되지 않음

    // 4. facilities 데이터 기반 마커 랜더링
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

    // 5. activeSlot 변경 시 Fly-To
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !activeSlot) return;

        const view = map.getView();
        view.animate({
            center: fromLonLat([activeSlot.lng, activeSlot.lat]),
            duration: 800,
            zoom: 14,
        });
    }, [activeSlot]);

    const toggleLayer = (id: string) => {
        setLayers((prev) =>
            prev.map((layer) => (layer.id === id ? { ...layer, enabled: !layer.enabled } : layer))
        );
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />

            {/* 마커 클릭 팝업 오버레이 */}
            <div
                ref={popupRef}
                className={`bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-200 text-xs font-semibold text-slate-800 transition-all z-20 ${
                    selectedFeature ? 'block' : 'hidden'
                }`}
            >
                {selectedFeature && (
                    <div className="space-y-1 relative pr-4">
                        <button
                            onClick={() => overlayRef.current?.setPosition(undefined)}
                            className="absolute -top-1 -right-3 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <div className="text-[10px] text-blue-600 font-bold tracking-wider">
                            {selectedFeature.type}
                        </div>
                        <div className="font-bold text-slate-900 text-sm">{selectedFeature.name}</div>
                        {selectedFeature.distance && (
                            <div className="text-[11px] text-slate-500 font-normal">
                                중심점으로부터 <span className="font-bold text-slate-700">{Math.round(selectedFeature.distance)}m</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 상단 오버레이 - 선택 지역 칩 */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 px-2">지역 선택</span>
                <div className="flex gap-1.5">
                    {slots.map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => onSelectSlot(slot)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                                activeSlot.id === slot.id ? 'ring-2 ring-offset-1 ring-slate-800 scale-105' : 'opacity-80'
                            }`}
                            style={{ backgroundColor: slot.color, color: '#ffffff' }}
                        >
                            <span
                                className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] font-bold"
                                style={{ color: slot.color }}
                            >
                                {slot.id}
                            </span>
                            {slot.name}
                        </button>
                    ))}
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