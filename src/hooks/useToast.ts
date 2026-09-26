import { useCallback, useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 3000;

export function useToast() {
    const [message, setMessage] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((msg: string) => {
        // 이전 타이머가 새 메시지를 일찍 지우지 않도록 먼저 취소
        if (timerRef.current) clearTimeout(timerRef.current);
        setMessage(msg);
        timerRef.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
    }, []);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { message, showToast };
}
