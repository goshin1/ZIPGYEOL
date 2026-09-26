import type { FeatureLike } from 'ol/Feature';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { FACILITY_TYPES, type FacilityType } from '@/constants/facilities';

// 마커 안에 들어갈 아이콘 (lucide 아이콘의 SVG path)
const ICON_SVG_PATHS: Record<FacilityType, string> = {
    PARK: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h2a3 3 0 0 0 1-5.8V13a3 3 0 0 0-6 0v.2A3 3 0 0 0 8.9 19H12Z"/>',
    HOSPITAL: '<path d="M12 6v12M6 12h12"/><rect width="18" height="18" x="3" y="3" rx="2"/>',
    SUBWAY: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16M12 3v8M8 19l-3 3M16 19l3 3M9 15h.01M15 15h.01"/>',
    PHARMACY: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
};

function createMarkerSvg(type: FacilityType): string {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10.5" fill="${FACILITY_TYPES[type].color}" stroke="#ffffff" stroke-width="2"/>
        <g transform="translate(4, 4) scale(0.66)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            ${ICON_SVG_PATHS[type]}
        </g>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// 아이콘 이미지는 카테고리당 하나만 만들어 재사용
const iconCache = new Map<FacilityType, Icon>();
function getIcon(type: FacilityType): Icon {
    let icon = iconCache.get(type);
    if (!icon) {
        icon = new Icon({ src: createMarkerSvg(type), anchor: [0.5, 0.5] });
        iconCache.set(type, icon);
    }
    return icon;
}

/** VectorLayer 스타일 함수: 피처의 type/name 속성으로 마커 + 라벨을 그린다 */
export function facilityMarkerStyle(feature: FeatureLike): Style {
    return new Style({
        image: getIcon(feature.get('type') as FacilityType),
        text: new Text({
            text: feature.get('name') as string,
            offsetY: -22,
            font: 'bold 11px sans-serif',
            fill: new Fill({ color: '#1e293b' }),
            stroke: new Stroke({ color: '#ffffff', width: 2.5 }),
        }),
    });
}
