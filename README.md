# ZIPGyeol

지도에서 최대 3개 지역(A/B/C 슬롯)을 골라 **생활 인프라(공원·병원·약국·지하철)**, **연령별 인구**, **부동산 실거래가**를 비교하는 서비스입니다.

- Next.js 16 (App Router) · React 19 · TypeScript
- 지도: OpenLayers + VWorld 타일 / 주소 검색
- 데이터: Supabase (PostGIS + RPC 함수)
- 스타일: Tailwind CSS v4 · 차트: Recharts

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev                   # http://localhost:3000
```

| 스크립트            | 설명                        |
| ------------------- | --------------------------- |
| `npm run dev`       | 개발 서버                   |
| `npm run build`     | 프로덕션 빌드               |
| `npm run lint`      | ESLint                      |
| `npm run typecheck` | TypeScript 타입 검사        |
| `npm test`          | 단위 테스트 (Vitest)        |
| `npm run format`    | Prettier로 코드 스타일 정리 |

## 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx              # HTML 뼈대, 메타데이터, 테마 초기화 스크립트
│  ├─ page.tsx                # 메인 화면: 슬롯 상태를 들고 각 영역을 조립
│  └─ api/geocoding/route.ts  # VWorld 주소 검색 프록시 (서버에서 API 키 부착)
├─ features/                  # 화면 기능 단위
│  ├─ map/                    # 지도, 마커, 레이어 토글, 슬롯 칩
│  ├─ region-detail/          # 하단 상세 패널 (인프라/인구/실거래가 탭)
│  └─ compare/                # 우측 A/B/C 비교 패널
├─ components/                # 여러 기능이 공유하는 UI
│  ├─ layout/                 # Header, SearchBar, MobileTabBar
│  ├─ ui/                     # SegmentedTabs, Toast, EmptyState
│  └─ charts/chartTheme.ts    # 차트 공통 스타일
├─ hooks/                     # 상태/데이터 조회 로직 (useRegionData, useTheme, useToast ...)
├─ lib/
│  ├─ api/                    # 외부 호출(Supabase RPC, 지오코딩)을 모은 서비스 레이어
│  ├─ scores.ts               # 인프라 점수 계산 (순수 함수)
│  ├─ address.ts              # 주소 → 시·군·구 추출 (순수 함수)
│  └─ realEstate.ts           # 실거래가 연도별 집계 (순수 함수)
├─ constants/                 # 시설 카테고리 정의, 기본 슬롯
└─ types/                     # 공통 타입
```

## 데이터 흐름

```
page.tsx (slots, activeSlotId 상태)
  │
  ├─ useSlotFacilities(slots) ──► lib/api/facilities ──► Supabase RPC get_nearby_facilities
  │     └─ 슬롯별 시설 목록 ─┬─► VWorldMap (마커 그리기)
  │                          ├─► RegionDetailSection > FacilityTab (목록·점수)
  │                          └─► AnalysisPanel > ComparisonRadar (3개 슬롯 점수 비교)
  │
  ├─ RegionDetailSection
  │     ├─ PopulationTab ─ usePopulation ──► get_population_by_region
  │     └─ RealEstateTab ─ useRealEstateTrends ──► get_real_estate_trends
  │
  ├─ AnalysisPanel ─ useSlotRealEstateTrends ──► get_real_estate_trends (슬롯 3개)
  │
  └─ Header > SearchBar ──► /api/geocoding ──► VWorld 검색 API
        └─ 결과 주소를 parseRegion() → 활성 슬롯의 이름/좌표 교체
```

**규칙**

- 컴포넌트는 Supabase를 직접 부르지 않고 `hooks/` → `lib/api/` 를 거친다.
- 시설 카테고리(라벨·색·아이콘·점수 기준)는 `constants/facilities.ts` 한 곳에서만 정의한다.
- 계산 로직은 `lib/`의 순수 함수로 두고 `src/lib/__tests__`에서 테스트한다.

## 코드 읽는 순서 (처음 보는 사람용)

1. `types/index.ts`, `constants/` — 이 앱이 다루는 데이터가 무엇인지
2. `app/page.tsx` — 화면이 어떻게 조립되고 상태가 어디에 있는지
3. `hooks/useAsyncData.ts` → `hooks/useRegionData.ts` → `lib/api/*` — 데이터가 어떻게 들어오는지
4. `features/map/VWorldMap.tsx` — OpenLayers 지도 생명주기 (생성 / 이동 / 마커 갱신 effect 3개)
5. `features/region-detail/`, `features/compare/` — 데이터가 어떻게 그려지는지
6. `lib/scores.ts`, `lib/address.ts` + 테스트 — 계산 규칙

## Supabase

사용하는 RPC 함수 (인자 → 반환):

| 함수                       | 인자                                    | 반환 주요 필드                                  |
| -------------------------- | --------------------------------------- | ----------------------------------------------- |
| `get_nearby_facilities`    | `lat_input, lng_input, radius_meters`   | `id, name, facility_type, lat, lng, distance`   |
| `get_population_by_region` | `region_name` (예: `서울특별시 강남구`) | `region_raw, total_pop, age_0_9 … age_100_plus` |
| `get_real_estate_trends`   | `sigungu_input, housing_type_input`     | `deal_month, avg_price(만원), deal_count`       |

`supabase/` 폴더(seed 데이터 등)는 용량 때문에 git에서 제외되어 있습니다.
