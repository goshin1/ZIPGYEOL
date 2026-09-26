/**
 * 행정구역 원본(data/geojson-raw) → 화면용 파일(public/geojson) 생성
 *
 *   public/geojson/regions.json       검색 목록 (korea-region.json + 행정구역 코드)
 *   public/geojson/sido.geojson       시도 경계
 *   public/geojson/sgg.geojson        시군구 경계
 *   public/geojson/hjd/<시도>.geojson 단순화한 행정동 경계 (시도별 분리)
 *
 * 검색 목록과 경계는 key('시도|시군구|읍면동', 없는 단위는 빈 문자열)로 연결된다.
 *
 * 실행: npm run build:regions
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mapshaper from 'mapshaper';

const RAW_DIR = 'data/geojson-raw';
const OUT_DIR = 'public/geojson';
const RAW_FILES = { sido: 'korea-sido.geojson', sgg: 'korea-sgg.geojson', hjd: 'korea-hjd.geojson' };
const REGION_LIST_FILE = 'korea-region.json';

/** 행정동 경계 단순화 비율 (남길 꼭짓점 비율) */
const HJD_SIMPLIFY = '10%';
/** 좌표 소수점 자리수 (0.00001도 ≈ 1m) */
const PRECISION = 0.00001;

const toKey = (sido, sigungu = '', emd = '') => `${sido}|${sigungu}|${emd}`;

/** mapshaper 명령을 메모리에서 실행하고 출력 GeoJSON 하나를 객체로 돌려준다 */
async function runMapshaper(input, commands, outputOptions = '') {
    const output = await mapshaper.applyCommands(`-i input.geojson ${commands} -o output.geojson ${outputOptions}`, {
        'input.geojson': input,
    });
    return JSON.parse(output['output.geojson']);
}

/** 원본 속성 → { key, code } (원본 이름을 그대로 써야 korea-region.json과 맞는다) */
const PROPERTIES = {
    sido: (p) => ({ key: toKey(p.sidonm), code: p.sido }),
    sgg: (p) => ({ key: toKey(p.sidonm, p.sggnm), code: p.sgg }),
    hjd: (p) => {
        const prefix = `${p.sidonm} ${p.sggnm} `;
        if (!p.adm_nm.startsWith(prefix)) throw new Error(`행정동 이름 형식 불일치: ${p.adm_nm}`);
        return { key: toKey(p.sidonm, p.sggnm, p.adm_nm.slice(prefix.length)), code: p.adm_cd2, sido: p.sido };
    },
};

async function main() {
    const raw = {};
    for (const [level, file] of Object.entries(RAW_FILES)) {
        const geojson = JSON.parse(await readFile(path.join(RAW_DIR, file), 'utf8'));
        // 속성은 key, code만 남긴다 (mapshaper -each 식보다 JS로 바꾸는 편이 읽기 쉬움)
        for (const feature of geojson.features) feature.properties = PROPERTIES[level](feature.properties);
        raw[level] = geojson;
    }
    const regionList = JSON.parse(await readFile(path.join(RAW_DIR, REGION_LIST_FILE), 'utf8'));

    // 1. 검색 목록: 경계와 1:1로 맞는지 검사하고 코드를 붙인다
    const codeByKey = new Map(
        Object.values(raw).flatMap(({ features }) => features.map(({ properties: p }) => [p.key, p.code])),
    );
    const regions = regionList.map((region) => ({
        ...region,
        code: codeByKey.get(toKey(region.sido, region.sigungu, region.emd)),
    }));
    validate(regions, codeByKey);

    // 2. 경계 파일 (시도/시군구 원본은 이미 단순화되어 있어 좌표 자리수만 맞춘다)
    const [sido, sgg, hjd] = await Promise.all([
        runMapshaper(JSON.stringify(raw.sido), '', `precision=${PRECISION}`),
        runMapshaper(JSON.stringify(raw.sgg), '', `precision=${PRECISION}`),
        runMapshaper(JSON.stringify(raw.hjd), `-simplify ${HJD_SIMPLIFY} keep-shapes`, `precision=${PRECISION}`),
    ]);

    // 3. 쓰기
    await rm(OUT_DIR, { recursive: true, force: true });
    await mkdir(path.join(OUT_DIR, 'hjd'), { recursive: true });

    const written = [];
    const write = async (file, data) => {
        const target = path.join(OUT_DIR, file);
        await writeFile(target, JSON.stringify(data));
        written.push({ file, size: (await stat(target)).size });
    };

    await write('regions.json', regions);
    await write('sido.geojson', sido);
    await write('sgg.geojson', sgg);

    const bySido = Map.groupBy(hjd.features, (feature) => feature.properties.sido);
    for (const [code, list] of [...bySido].sort(([a], [b]) => a.localeCompare(b))) {
        for (const feature of list) delete feature.properties.sido;
        await write(`hjd/${code}.geojson`, { type: 'FeatureCollection', features: list });
    }

    const count = (level) => regions.filter(level).length;
    console.log(
        `regions: 시도 ${count((r) => !r.sigungu)}, 시군구 ${count((r) => r.sigungu && !r.emd)}, 읍면동 ${count((r) => r.emd)}`,
    );
    console.table(written.map(({ file, size }) => ({ file, KB: Math.round(size / 1024) })));
    const total = written.filter(({ file }) => file.startsWith('hjd/')).reduce((sum, { size }) => sum + size, 0);
    console.log(`행정동 합계 ${(total / 1024 / 1024).toFixed(2)}MB`);
}

/** 검색 목록과 경계가 어긋나면 선택한 지역의 경계를 못 그리므로 생성 단계에서 막는다 */
function validate(regions, codeByKey) {
    const errors = [];
    const keys = new Set();
    for (const region of regions) {
        const key = toKey(region.sido, region.sigungu, region.emd);
        if (region.emd && !region.sigungu) errors.push(`시군구 없이 읍면동만 있음: ${key}`);
        if (keys.has(key)) errors.push(`중복: ${key}`);
        keys.add(key);
        if (!region.code) errors.push(`경계 없음: ${key}`);
        if (!Number.isFinite(region.lat) || !Number.isFinite(region.lng)) errors.push(`좌표 오류: ${key}`);
    }
    for (const key of codeByKey.keys()) {
        if (!keys.has(key)) errors.push(`검색 목록에 없는 경계: ${key}`);
    }
    if (errors.length > 0) throw new Error(`검증 실패 ${errors.length}건\n${errors.slice(0, 20).join('\n')}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
