import type { Metadata, Viewport } from 'next';
import { THEME_INIT_SCRIPT } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
    title: 'ZIPGyeol',
    description: '지역별 생활 인프라·인구·부동산 실거래가를 지도에서 비교하는 서비스',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        // 테마 스크립트가 hydration 전에 class를 바꾸므로 경고 억제
        <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
            </head>
            <body className="min-h-full flex flex-col">{children}</body>
        </html>
    );
}
