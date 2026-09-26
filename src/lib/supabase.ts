import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 설정 누락을 "데이터 없음"으로 숨기지 않고 즉시 드러낸다 (fail-fast)
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Supabase 환경 변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다. .env.example을 참고하세요.',
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
