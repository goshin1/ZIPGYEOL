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
import { Style, Fill, Stroke, Text, Icon } from 'ol/style';
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

// 카테고리별 SVG 아이콘 Path (Lucide 아이콘 규격)
const ICON_SVG_PATHS: Record<string, string> = {
    APT: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8"/><path d="M18 9h2a2 2 0 0 1 2 2v11"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
    PARK: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h2a3 3 0 0 0 1-5.8V13a3 3 0 0 0-6 0v.2A3 3 0 0 0 8.9 19H12Z"/>',
    GOV: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7 12 2"/>',
    SCHOOL: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    HOSPITAL: '<path d="M12 6v12M6 12h12"/><rect width="18" height="18" x="3" y="3" rx="2"/>',
    SUBWAY: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16M12 3v8M8 19l-3 3M16 19l3 3M9 15h.01M15 15h.01"/>',
    STORE: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>',
};

// 범례 색상 + 흰색 SVG 아이콘 마커 생성 함수
const createCustomMarkerSvg = (color: string, type: string) => {
    const svgPath = ICON_SVG_PATHS[type] || ICON_SVG_PATHS.APT;
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10.5" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <g transform="translate(4, 4) scale(0.66)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            ${svgPath}
        </g>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

export default function VWorldMap({ activeSlot, slots, onSelectSlot, onFacilitiesFetched }: VWorldMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<Map | null>(null);
    const overlayRef = useRef<Overlay | null>(null);
    const vectorSourceRef = useRef<VectorSource>(new VectorSource());

    // 부모 콜백 Ref 관리
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

    // Supabase RPC 호출
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
                onFacilitiesFetchedRef.current?.(data);
            }
        } catch (err) {
            console.error('Data Fetching Failed:', err);
        }
    }, []);

    // OpenLayers 지도 초기화
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

        fetchNearbyFacilities(initialCenter[1], initialCenter[0]);

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
            }, 400);
        });

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
    }, []);

    // facilities 데이터 기반 마커 랜더링
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
                    image: new Icon({
                        src: createCustomMarkerSvg(markerColor, item.facility_type),
                        anchor: [0.5, 0.5],
                        scale: 1,
                    }),
                    text: new Text({
                        text: item.name,
                        offsetY: -22,
                        font: 'bold 11px sans-serif',
                        fill: new Fill({ color: '#1e293b' }),
                        stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
                    }),
                })
            );

            vectorSource.addFeature(feature);
        });
    }, [facilities, layers]);

    // activeSlot 변경 시 Fly-To
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
            <div ref={mapRef} className="w-full h-full bg-slate-100 dark:bg-slate-900 transition-all duration-300 dark:invert-[0.95] dark:hue-rotate-10 dark:brightness-100" />

            {/* 1. 마커 클릭 팝업 오버레이 (다크모드 지원 반영) */}
            <div
                ref={popupRef}
                className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-all z-20 ${
                    selectedFeature ? 'block' : 'hidden'
                }`}
            >
                {selectedFeature && (
                    <div className="space-y-1 relative pr-4">
                        <button
                            onClick={() => overlayRef.current?.setPosition(undefined)}
                            className="absolute -top-1 -right-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider">
                            {selectedFeature.type}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedFeature.name}</div>
                        {selectedFeature.distance && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                중심점으로부터 <span className="font-bold text-slate-700 dark:text-slate-200">{Math.round(selectedFeature.distance)}m</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. 상단 오버레이 - 선택 지역 칩 (다크모드 지원 반영) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">지역 선택</span>
                <div className="flex gap-1.5">
                    {slots.map((slot) => (
                        <button
                            key={slot.id}
                            onClick={() => onSelectSlot(slot)}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                                activeSlot.id === slot.id ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-slate-200 scale-105' : 'opacity-80'
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

            {/* 3. 좌측 레이어 토글 패널 (다크모드 지원 반영) */}
            <div className="absolute top-20 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 w-44">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2.5">주변 환경 레이어</h3>
                <div className="space-y-2">
                    {layers.map((layer) => {
                        const IconComponent = layer.icon;
                        return (
                            <div key={layer.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                    <IconComponent className="w-3.5 h-3.5" style={{ color: layer.color }} />
                                    <span>{layer.label}</span>
                                </div>
                                <button
                                    onClick={() => toggleLayer(layer.id)}
                                    className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                                        layer.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                                    }`}
                                >
                                    <span className="w-3 h-3 bg-white dark:bg-slate-200 rounded-full shadow-md" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}