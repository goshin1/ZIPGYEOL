import type { RegionSlot, SlotId } from '@/types';

export const SLOT_IDS: readonly SlotId[] = ['A', 'B', 'C'];

/** 첫 진입 시 비교 슬롯 기본값 */
export const DEFAULT_SLOTS: RegionSlot[] = [
    { id: 'A', name: '강남구', region: '서울특별시 강남구', lat: 37.5172, lng: 127.0473, color: '#2563eb' },
    { id: 'B', name: '마포구', region: '서울특별시 마포구', lat: 37.5663, lng: 126.9014, color: '#9333ea' },
    { id: 'C', name: '송파구', region: '서울특별시 송파구', lat: 37.5145, lng: 127.1059, color: '#10b981' },
];
