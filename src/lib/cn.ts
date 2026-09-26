import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 조건부 className 결합 + Tailwind 클래스 충돌 정리 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
