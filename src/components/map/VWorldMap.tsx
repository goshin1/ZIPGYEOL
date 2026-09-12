'use client';

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { Building2, Trees, Landmark, School, Hospital, Train, Store } from 'lucide-react';

interface LayerToggle {
    id: string;
    label: string;
    icon: any;
    enabled: boolean;
}

export default function VWorldMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const [layers, setLayers] = useState<LayerToggle[]>([
        { id: 'APT', label: '아파트', icon: Building2, enabled: true },
        { id: 'PARK', label: '공원', icon: Trees, enabled: true },
        { id: 'GOV', label: '공공기관', icon: Landmark, enabled: true },
        { id: 'SCHOOL', label: '학교', icon: School, enabled: false },
        { id: 'HOSPITAL', label: '병원', icon: Hospital, enabled: true },
        { id: 'SUBWAY', label: '지하철/교통', icon: Train, enabled: true },
        { id: 'STORE', label: '편의시설', icon: Store, enabled: false },
    ]);

    useEffect(() => {
        if (!mapRef.current) return;

        const apiKey = process.env.NEXT_PUBLIC_VWORLD_API_KEY;

        // VWORLD WMTS 타일맵 설정
        const vworldBaseLayer = new TileLayer({
            source: new XYZ({
                url: `https://api.vworld.kr/req/wmts/1.0.0/${apiKey}/Base/{z}/{y}/{x}.png`,
                crossOrigin: 'anonymous',
            }),
        });

        const map = new Map({
            target: mapRef.current,
            layers: [vworldBaseLayer],
            view: new View({
                center: fromLonLat([127.0365, 37.5006]), // 서울 강남/서초 중심 좌표
                zoom: 13,
            }),
        });

        return () => {
            map.setTarget(undefined);
        };
    }, []);

    const toggleLayer = (id: string) => {
        setLayers((prev) =>
            prev.map((layer) => (layer.id === id ? { ...layer, enabled: !layer.enabled } : layer))
        );
    };

    return (
        <div className="relative w-full h-full">
            {/* 1. OpenLayers 맵 캔버스 */}
            <div ref={mapRef} className="w-full h-full absolute inset-0 z-0" />

            {/* 2. 상단 지역 선택 칩 (시안 오버레이) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 px-2">지역 선택</span>
                <div className="flex gap-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm">
            <span className="w-4 h-4 rounded-full bg-white text-blue-600 flex items-center justify-center text-[10px]">A</span>
            강남구 역삼동
          </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold shadow-sm">
            <span className="w-4 h-4 rounded-full bg-white text-purple-600 flex items-center justify-center text-[10px]">B</span>
            서초구 서초동
          </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-sm">
            <span className="w-4 h-4 rounded-full bg-white text-emerald-600 flex items-center justify-center text-[10px]">C</span>
            송파구 잠실동
          </span>
                    <button className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center justify-center text-sm font-bold transition-all">
                        +
                    </button>
                </div>
            </div>

            {/* 3. 좌측 주변 환경 레이어 토글 박스 (시안 오버레이) */}
            <div className="absolute top-20 left-4 z-10 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 w-44">
                <h3 className="text-xs font-bold text-slate-700 mb-2.5">주변 환경 레이어</h3>
                <div className="space-y-2">
                    {layers.map((layer) => {
                        const IconComponent = layer.icon;
                        return (
                            <div key={layer.id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-700 font-medium">
                                    <IconComponent className="w-3.5 h-3.5 text-slate-500" />
                                    <span>{layer.label}</span>
                                </div>
                                <button
                                    onClick={() => toggleLayer(layer.id)}
                                    className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                                        layer.enabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                                    }`}
                                >
                                    <span className="w-3 h-3 bg-white rounded-full shadow-md transform transition-transform" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}