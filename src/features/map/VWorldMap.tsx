'use client';

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import OlMap from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { X } from 'lucide-react';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES, type FacilityType, isFacilityType } from '@/constants/facilities';
import type { Facility, RegionSlot, SlotId } from '@/types';
import LayerPanel from './LayerPanel';
import { facilityMarkerStyle } from './markerStyle';
import SlotChips from './SlotChips';

interface VWorldMapProps {
    slots: RegionSlot[];
    activeSlot: RegionSlot;
    /** 활성 슬롯 주변 시설 (조회는 상위에서 하고, 지도는 그리기만 한다) */
    facilities: Facility[];
    onSelectSlot: (id: SlotId) => void;
}

interface SelectedFacility {
    name: string;
    type: FacilityType;
    distance: number;
}

const DEFAULT_ZOOM = 14;

export default function VWorldMap({ slots, activeSlot, facilities, onSelectSlot }: VWorldMapProps) {
    const mapElementRef = useRef<HTMLDivElement>(null);
    const popupElementRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<OlMap | null>(null);
    const overlayRef = useRef<Overlay | null>(null);
    const vectorSourceRef = useRef(new VectorSource());
    // 지도 생성 시점의 중심 좌표 (이후 이동은 아래 activeSlot effect가 담당)
    const initialSlotRef = useRef(activeSlot);

    const [selected, setSelected] = useState<SelectedFacility | null>(null);
    const [enabledLayers, setEnabledLayers] = useState<Record<FacilityType, boolean>>(
        () => Object.fromEntries(FACILITY_TYPE_KEYS.map((type) => [type, true])) as Record<FacilityType, boolean>,
    );

    // 1) 지도 인스턴스 생성: 마운트 시 한 번만
    useEffect(() => {
        if (!mapElementRef.current || !popupElementRef.current) return;

        const overlay = new Overlay({
            element: popupElementRef.current,
            autoPan: { animation: { duration: 250 } },
            positioning: 'bottom-center',
            offset: [0, -15],
            stopEvent: true,
        });
        overlayRef.current = overlay;

        const { lng, lat } = initialSlotRef.current;
        const map = new OlMap({
            target: mapElementRef.current,
            layers: [
                new TileLayer({
                    className: 'vworld-tile-layer', // 다크모드 필터 대상 (globals.css)
                    source: new XYZ({
                        url: `https://api.vworld.kr/req/wmts/1.0.0/${process.env.NEXT_PUBLIC_VWORLD_API_KEY}/Base/{z}/{y}/{x}.png`,
                        crossOrigin: 'anonymous',
                    }),
                }),
                new VectorLayer({ source: vectorSourceRef.current, style: facilityMarkerStyle }),
            ],
            overlays: [overlay],
            controls: [],
            view: new View({ center: fromLonLat([lng, lat]), zoom: DEFAULT_ZOOM }),
        });
        mapRef.current = map;

        map.on('singleclick', (event) => {
            const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f);
            if (feature) {
                const point = feature.getGeometry() as Point;
                setSelected({
                    name: feature.get('name'),
                    type: feature.get('type'),
                    distance: feature.get('distance'),
                });
                overlay.setPosition(point.getCoordinates());
            } else {
                overlay.setPosition(undefined);
                setSelected(null);
            }
        });

        return () => {
            map.setTarget(undefined);
            mapRef.current = null;
        };
    }, []);

    // 2) 활성 슬롯이 바뀌면 해당 좌표로 이동
    useEffect(() => {
        mapRef.current?.getView().animate({
            center: fromLonLat([activeSlot.lng, activeSlot.lat]),
            duration: 800,
            zoom: DEFAULT_ZOOM,
        });
    }, [activeSlot.lat, activeSlot.lng]);

    // 3) 시설 데이터/레이어 설정이 바뀌면 마커 다시 그리기
    useEffect(() => {
        const features = facilities
            .filter((item) => isFacilityType(item.facility_type) && enabledLayers[item.facility_type])
            .map(
                (item) =>
                    new Feature({
                        geometry: new Point(fromLonLat([item.lng, item.lat])),
                        name: item.name,
                        type: item.facility_type,
                        distance: item.distance_meters,
                    }),
            );
        const source = vectorSourceRef.current;
        source.clear();
        source.addFeatures(features);
    }, [facilities, enabledLayers]);

    const closePopup = () => {
        overlayRef.current?.setPosition(undefined);
        setSelected(null);
    };

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div
                ref={mapElementRef}
                className="w-full h-full bg-slate-100 dark:bg-slate-950 transition-colors duration-300"
            />

            {/* 마커 클릭 팝업 (OpenLayers Overlay가 위치를 제어) */}
            <div
                ref={popupElementRef}
                className={`z-30 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3.5 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 ${
                    selected ? 'block' : 'hidden'
                }`}
            >
                {selected && (
                    <div className="space-y-1 relative pr-5 min-w-[140px]">
                        <button
                            type="button"
                            onClick={closePopup}
                            aria-label="닫기"
                            className="absolute -top-1 -right-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-lg transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider">
                            {FACILITY_TYPES[selected.type]?.label ?? selected.type}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                            {selected.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal pt-0.5">
                            반경{' '}
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                {Math.round(selected.distance)}m
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <SlotChips slots={slots} activeSlotId={activeSlot.id} onSelectSlot={onSelectSlot} />
            <LayerPanel
                enabled={enabledLayers}
                onToggle={(type) => setEnabledLayers((prev) => ({ ...prev, [type]: !prev[type] }))}
            />
        </div>
    );
}
