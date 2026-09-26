import { useCallback, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/theme';

// 초기 테마 적용은 layout.tsx의 인라인 스크립트(lib/theme.ts)가 첫 렌더 전에 처리한다.
// 이 훅은 <html class="dark"> 상태를 "외부 저장소"로 보고 구독한다.

function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
}

const getSnapshot = () => document.documentElement.classList.contains('dark');
const getServerSnapshot = () => false;

export function useTheme() {
    const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const toggleTheme = useCallback(() => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
        } catch {
            // 저장소 접근이 막힌 환경(시크릿 모드 등)에서는 저장만 생략
        }
    }, []);

    return { isDark, toggleTheme };
}
