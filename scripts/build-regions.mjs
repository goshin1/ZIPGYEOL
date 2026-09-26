/**
 * 행정구역 경계 원본(data/geojson-raw) → 화면용 파일(public/geojson) 생성
 *
 *   public/geojson/regions.json      선택 목록 (코드, 이름, 상위 코드, 중심 좌표)
 *   public/geojson/sido.geojson      시도 경계
 *   public/geojson/sgg.geojson       시군구 경계
 *   public/geojson/hjd/<시도>.geojson 단순화한 행정동 경계 (시도별 분리)
 *
 * 실행: npm run build:regions
 */
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mapshaper from 'mapshaper';

const RAW_DIR = 'data/geojson-raw';
const OUT_DIR = 'public/geojson';
const RAW_FILES = { sido: 'korea-sido.geojson', sgg: 'korea-sgg.geojson', hjd: 'korea-hjd.geojson' };

/** 행정동 경계 단순화 비율 (남길 꼭짓점 비율) */
const HJD_SIMPLIFY = '10%';
/** 좌표 소수점 자리수 (0.00001도 ≈ 1m) */
const PRECISION = 0.00001;

const round = (value) => Math.round(value / PRECISION) * PRECISION;
const roundCoord = ([lng, lat]) => [Number(round(lng).toFixed(5)), Number(round(lat).toFixed(5))];

/** '수원시장안구' → '수원시 장안구' (DB 표기와 맞춤) */
const formatSggName = (name) => name.replace(/^(\S+시)(\S+구)$/, '$1 $2');

/** mapshaper 명령을 메모리에서 실행하고 출력 GeoJSON 하나를 객체로 돌려준다 */
async function runMapshaper(input, commands, outputOptions = '') {
    const output = await mapshaper.applyCommands(`-i input.geojson ${commands} -o output.geojson ${outputOptions}`, {
        'input.geojson': input,
    });
    return JSON.parse(output['output.geojson']);
}

/** 폴리곤 안쪽에 있는 대표점 (오목한 경계에서도 경계 밖으로 나가지 않음) */
async function interiorPoints(input) {
    const points = await runMapshaper(input, '-points inner');
    return points.features.map((feature) => roundCoord(feature.geometry.coordinates));
}

async function main() {
    const raw = {};
    for (const [level, file] of Object.entries(RAW_FILES)) {
        raw[level] = await readFile(path.join(RAW_DIR, file), 'utf8');
    }
    const features = Object.fromEntries(Object.entries(raw).map(([level, text]) => [level, JSON.parse(text).features]));

    // 1. 선택 목록 (대표점은 단순화 전 원본 경계로 계산)
    const centers = {};
    for (const level of Object.keys(raw)) centers[level] = await interiorPoints(raw[level]);

    const regions = [
        ...features.sido.map(({ properties: p }, i) => ({
            level: 'sido',
            code: p.sido,
            name: p.sidonm,
            fullName: p.sidonm,
            parent: null,
            center: centers.sido[i],
        })),
        ...features.sgg.map(({ properties: p }, i) => ({
            level: 'sgg',
            code: p.sgg,
            name: formatSggName(p.sggnm),
            fullName: `${p.sidonm} ${formatSggName(p.sggnm)}`,
            parent: p.sgg.slice(0, 2),
            center: centers.sgg[i],
        })),
        ...features.hjd.map(({ properties: p }, i) => ({
            level: 'hjd',
            code: p.adm_cd2,
            name: p.adm_nm.split(' ').at(-1),
            fullName: `${p.sidonm} ${formatSggName(p.sggnm)} ${p.adm_nm.split(' ').at(-1)}`,
            parent: p.sgg,
            center: centers.hjd[i],
        })),
    ];
    validate(regions);

    // 2. 경계 파일: 속성은 코드와 이름만 남긴다
    const sido = await runMapshaper(
        raw.sido,
        `-each "code=sido, name=sidonm" -filter-fields code,name`,
        `precision=${PRECISION}`,
    );
    const sgg = await runMapshaper(
        raw.sgg,
        `-each "code=sgg, name=sggnm, parent=sgg.slice(0,2)" -filter-fields code,name,parent`,
        `precision=${PRECISION}`,
    );
    const hjd = await runMapshaper(
        raw.hjd,
        `-simplify ${HJD_SIMPLIFY} keep-shapes -each "code=adm_cd2, name=adm_nm.split(' ').pop(), parent=sgg, sido=sido" ` +
            `-filter-fields code,name,parent,sido`,
        `precision=${PRECISION}`,
    );
    for (const feature of sgg.features) feature.properties.name = formatSggName(feature.properties.name);

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

    const counts = Object.groupBy(regions, (region) => region.level);
    console.log(`regions: 시도 ${counts.sido.length}, 시군구 ${counts.sgg.length}, 행정동 ${counts.hjd.length}`);
    console.table(written.map(({ file, size }) => ({ file, KB: Math.round(size / 1024) })));
    const total = written.filter(({ file }) => file.startsWith('hjd/')).reduce((sum, { size }) => sum + size, 0);
    console.log(
        `행정동 합계 ${(total / 1024 / 1024).toFixed(2)}MB (원본 ${(raw.hjd.length / 1024 / 1024).toFixed(2)}MB)`,
    );
}

/** 코드 체계가 어긋나면 화면에서 선택이 끊기므로 생성 단계에서 막는다 */
function validate(regions) {
    const codes = new Set();
    for (const region of regions) {
        if (codes.has(region.code)) throw new Error(`중복 코드: ${region.code} ${region.fullName}`);
        codes.add(region.code);
    }
    for (const region of regions) {
        if (region.parent && !codes.has(region.parent)) {
            throw new Error(`상위 지역 없음: ${region.fullName} (parent ${region.parent})`);
        }
        if (region.parent && !region.code.startsWith(region.parent)) {
            throw new Error(`코드 접두어 불일치: ${region.fullName} (${region.code} / ${region.parent})`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
