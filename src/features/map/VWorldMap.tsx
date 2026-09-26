'use client';

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import OlMap from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { X } from 'lucide-react';
import { FACILITY_TYPE_KEYS, FACILITY_TYPES, type FacilityType, isFacilityType } from '@/constants/facilities';
import type { AsyncState } from '@/hooks/useAsyncData';
import type { BoundaryFeature, Facility, RegionSlot, SlotId, SlotRecord } from '@/types';
import { boundaryStyle } from './boundaryStyle';
import LayerPanel from './LayerPanel';
import { facilityMarkerStyle } from './markerStyle';
import SlotChips from './SlotChips';

interface VWorldMapProps {
    slots: RegionSlot[];
    activeSlot: RegionSlot;
    /** 활성 슬롯 주변 시설 (조회는 상위에서 하고, 지도는 그리기만 한다) */
    facilities: Facility[];
    /** 슬롯별 행정구역 경계 (조회는 상위에서 한다) */
    boundaries: SlotRecord<AsyncState<BoundaryFeature | null>>;
    onSelectSlot: (id: SlotId) => void;
}

interface SelectedFacility {
    name: string;
    type: FacilityType;
    distance: number;
}

const DEFAULT_ZOOM = 14;
/** 경계에 맞춰 이동할 때 최대 확대 (작은 행정동이 지나치게 커지지 않도록) */
const BOUNDARY_MAX_ZOOM = 15;
const BOUNDARY_PADDING = [80, 40, 40, 40];

const geoJson = new GeoJSON({ featureProjection: 'EPSG:3857' });

export default function VWorldMap({ slots, activeSlot, facilities, boundaries, onSelectSlot }: VWorldMapProps) {
    const mapElementRef = useRef<HTMLDivElement>(null);
    const popupElementRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<OlMap | null>(null);
    const overlayRef = useRef<Overlay | null>(null);
    const vectorSourceRef = useRef(new VectorSource());
    const boundarySourceRef = useRef(new VectorSource());
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
        const markerLayer = new VectorLayer({ source: vectorSourceRef.current, style: facilityMarkerStyle });
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
                // 경계는 마커 아래에 깔리도록 먼저 추가
                new VectorLayer({ source: boundarySourceRef.current, style: boundaryStyle }),
                markerLayer,
            ],
            overlays: [overlay],
            controls: [],
            view: new View({ center: fromLonLat([lng, lat]), zoom: DEFAULT_ZOOM }),
        });
        mapRef.current = map;

        map.on('singleclick', (event) => {
            // 경계 폴리곤은 클릭 대상이 아니므로 마커 레이어만 찾는다
            const feature = map.forEachFeatureAtPixel(event.pixel, (f) => f, {
                layerFilter: (layer) => layer === markerLayer,
            });
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

    // 2) 활성 슬롯이 바뀌면 이동: 경계가 있으면 경계에 맞추고, 없으면 좌표 중심으로
    const activeBoundary = boundaries[activeSlot.id];
    useEffect(() => {
        const view = mapRef.current?.getView();
        if (!view) return;
        // 경계를 받는 중이면 기다린다 (먼저 좌표로 갔다가 다시 맞추면 화면이 두 번 움직인다)
        if (activeBoundary.loading) return;

        view.cancelAnimations();
        if (activeBoundary.data) {
            const extent = geoJson.readGeometry(activeBoundary.data.geometry).getExtent();
            view.fit(extent, { padding: BOUNDARY_PADDING, maxZoom: BOUNDARY_MAX_ZOOM, duration: 800 });
        } else {
            view.animate({ center: fromLonLat([activeSlot.lng, activeSlot.lat]), duration: 800, zoom: DEFAULT_ZOOM });
        }
    }, [activeSlot.lat, activeSlot.lng, activeBoundary.loading, activeBoundary.data]);

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

    // 4) 슬롯 경계 다시 그리기 (슬롯 색으로, 활성 슬롯은 강조)
    const boundaryA = boundaries.A.data;
    const boundaryB = boundaries.B.data;
    const boundaryC = boundaries.C.data;
    useEffect(() => {
        const boundaryBySlot: SlotRecord<BoundaryFeature | null> = { A: boundaryA, B: boundaryB, C: boundaryC };
        const features = slots.flatMap((slot) => {
            const boundary = boundaryBySlot[slot.id];
            if (!boundary) return [];
            const feature = geoJson.readFeature(boundary) as Feature;
            feature.setProperties({ color: slot.color, active: slot.id === activeSlot.id });
            return [feature];
        });
        const source = boundarySourceRef.current;
        source.clear();
        source.addFeatures(features);
    }, [slots, boundaryA, boundaryB, boundaryC, activeSlot.id]);

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
