import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: '/geocoding', // 프론트엔드에서 요청하는 경로
                destination: 'https://api.vworld.kr/req/search', // 실제 백엔드 API 주소
            },
        ];
    },
};

export default nextConfig;
