import type { FeatureLike } from 'ol/Feature';
import { Fill, Stroke, Style } from 'ol/style';

/** '#2563eb' + 0.15 → 'rgba(37, 99, 235, 0.15)' */
function withAlpha(hex: string, alpha: number): string {
    const value = Number.parseInt(hex.slice(1), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/**
 * 슬롯 경계 스타일: 피처의 color(슬롯 색), active(활성 슬롯 여부) 속성으로 그린다.
 * 활성 슬롯은 진한 실선 + 옅은 채움, 나머지는 점선으로 위치만 보여준다.
 */
export function boundaryStyle(feature: FeatureLike): Style {
    const color = feature.get('color') as string;
    const active = feature.get('active') as boolean;
    return new Style({
        fill: new Fill({ color: withAlpha(color, active ? 0.15 : 0.05) }),
        stroke: new Stroke({
            color: withAlpha(color, active ? 1 : 0.7),
            width: active ? 3 : 2,
            lineDash: active ? undefined : [6, 4],
        }),
        // 겹치는 경계에서는 활성 슬롯이 위에 오도록
        zIndex: active ? 1 : 0,
    });
}
