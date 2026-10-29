// 온비드 웹사이트에서 압류재산 물건 모으기 (PLAN 작업 16 / DESIGN 3.1, 9장 ⑩·⑪ / PRD 5장 must ②)
// - 온비드 "물건 > 재산유형 > 압류재산" 목록 화면이 불러오는 JSON을 그대로 받는다(로그인 없이).
// - 지역본부 1곳씩 받는다. 한 번의 실행 시간 한도를 넘지 않게 하기 위해서다.
//   12곳을 모아 그 주로 확정하는 일은 저장 단계(PLAN 작업 18·20)가 맡는다.
// - 부동산·동산·차량 세 종류를 모든 페이지 받는다. 요청 사이에는 최소 3초를 쉰다.
// - 입찰 기간이 오늘 ~ 1년 뒤인 물건을 받아, "입찰준비중·입찰진행중"만 남긴다.
//   사이트는 물건마다 검색 기간에 걸리는 회차 하나만 돌려주므로, 시작일을 과거로 잡으면
//   지난 회차(입찰마감)가 대신 나와 다음 회차가 빠진다(2026-10-29 실제 수집에서 확인).
// - 한 번이라도 실패하거나 받은 건수가 전체 건수보다 적으면 전부 버리고 실패로 돌려준다.
// - 물건마다 5가지 항목만 남기고 나머지(주소·금액 등)는 버린다.

import "server-only";
import { REGION_OFFICES } from "../known-values";
import type { AuctionItem } from "../types";
import { toKstDate } from "../week";

const LIST_URL =
  "https://www.onbid.co.kr/op/cltrpbancinf/clbtcltrclg/prptclbtcltrclg/PrptClbtCltrController/inqSzrPrptCltrClg.do";

/** 물건유형 (온비드 검색 조건 srchCltrType) */
const CLTR_TYPES = [
  { code: "0001", name: "부동산" },
  { code: "0003", name: "동산" },
  { code: "0002", name: "차량" },
] as const;

const SEIZED = "0007"; // 재산유형: 압류재산
const SALE = "0001"; // 처분방식: 매각
const PAGE_SIZE = 100;
const MAX_PAGES = 200; // 응답이 이상해 끝없이 넘기는 일을 막는 안전장치
const REQUEST_GAP_MS = 3000; // 요청 간격 최소 3초 (PRD 5장)
const OPEN_STATUSES = new Set(["입찰준비중", "입찰진행중"]);
// 요청 하나가 이 시간 안에 끝나지 않으면 끊고 실패로 본다 (평소 1~2초). 응답이 없어 서버가 강제 종료되는 일을 막는다
const REQUEST_TIMEOUT_MS = 20_000;

/** 수집 실패 이유 */
export type CollectFailure =
  | "office" // 모르는 지역본부 코드
  | "http" // 응답 자체가 실패 (접속 오류·차단·시간 초과 포함)
  | "format"; // 응답 모양을 읽을 수 없음 (사이트 구조 변경, 대기열 화면 등)

export type OfficeCollectResult =
  | {
      ok: true;
      office: string;
      items: AuctionItem[];
      stats: {
        /** 물건유형별 사이트가 알려 준 전체 건수 (마감된 물건 포함) */
        rowCount: Record<string, number>;
        /** 입찰준비중·입찰진행중이 아니어서 뺀 건수 */
        closed: number;
        /** 같은 물건번호가 여러 번 와서 빼 낸 건수 */
        duplicates: number;
        /** 유찰 횟수가 비었거나 숫자가 아니어서 뺀 건수 (DESIGN 9장 ⑨) */
        invalidFailCount: number;
        requests: number;
        ms: number;
      };
    }
  | { ok: false; office: string; reason: CollectFailure; message: string };

/** 사이트 응답 중 이 앱이 읽는 항목 */
type RawItem = {
  scrnIndctCltrMngNo?: string;
  cltrPrptDivCd?: string;
  ctgrFullNm?: string;
  uscbdCnt?: string | number | null;
  pbctCltrStatNm?: string | null;
  pbancPbctCltrStatNm?: string | null;
  rowcount?: string | number;
};

type Options = {
  now?: Date;
  /** 시험할 때 가짜 응답을 넣기 위한 자리 */
  fetchImpl?: typeof fetch;
  /** 시험할 때 기다리지 않게 하기 위한 자리 */
  sleep?: (ms: number) => Promise<void>;
};

class CollectError extends Error {
  constructor(
    readonly reason: CollectFailure,
    message: string,
  ) {
    super(message);
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** `2026-10-29` 에 며칠 더하기 */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * `"주거용건물 / 단독주택"` → `"주거용건물"`.
 * 단계 구분은 앞뒤 띄어쓰기가 있는 " / "다. "석유/화학/연료"처럼 이름 안의 "/"는 자르지 않는다.
 */
export function topCategory(ctgrFullNm: string | undefined): string | null {
  const top = ctgrFullNm?.split(" / ")[0]?.trim();
  return top ? top : null;
}

async function fetchPage(
  fetchImpl: typeof fetch,
  form: Record<string, string>,
): Promise<{ rowCount: number; items: RawItem[] }> {
  const res = await fetchImpl(LIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (onbid-heatmap; weekly personal statistics)",
    },
    body: new URLSearchParams(form),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new CollectError("http", `HTTP ${res.status}`);
  const text = await res.text();
  let json: { cltrInfVOList?: RawItem[]; totalCount?: number | string };
  try {
    json = JSON.parse(text);
  } catch {
    // 대기열(NetFunnel) 화면이나 오류 화면이 HTML로 오는 경우
    throw new CollectError("format", "목록 JSON이 아닌 응답을 받았습니다");
  }
  if (!Array.isArray(json.cltrInfVOList)) throw new CollectError("format", "응답에 물건 목록이 없습니다");
  const list = json.cltrInfVOList;
  const rowCount = Number(list[0]?.rowcount ?? json.totalCount ?? 0);
  if (!Number.isInteger(rowCount) || rowCount < 0) throw new CollectError("format", "전체 건수를 읽을 수 없습니다");
  return { rowCount, items: list };
}

/**
 * 지역본부 1곳의 압류재산 물건 수집.
 * @param officeCode 온비드 담당부점 코드 (lib/known-values.ts의 REGION_OFFICES)
 */
export async function collectOffice(officeCode: string, options: Options = {}): Promise<OfficeCollectResult> {
  const { now = new Date(), fetchImpl = fetch, sleep = defaultSleep } = options;
  const office = REGION_OFFICES.find((o) => o.code === officeCode);
  if (!office) return { ok: false, office: officeCode, reason: "office", message: `모르는 지역본부 코드: ${officeCode}` };

  const started = Date.now();
  try {
    const today = toKstDate(now);
    const byItemNo = new Map<string, AuctionItem>();
    const rowCount: Record<string, number> = {};
    let closed = 0;
    let duplicates = 0;
    let invalidFailCount = 0;
    let requests = 0;

    for (const type of CLTR_TYPES) {
      let received = 0;
      for (let pageNo = 1; ; pageNo++) {
        if (pageNo > MAX_PAGES) throw new CollectError("format", `${type.name}: 페이지가 너무 많습니다`);
        if (requests > 0) await sleep(REQUEST_GAP_MS);
        const page = await fetchPage(fetchImpl, {
          pageIndex: String(pageNo),
          pageUnit: String(PAGE_SIZE),
          pageSize: String(PAGE_SIZE),
          recordCountPerPage: String(PAGE_SIZE),
          firstIndex: String((pageNo - 1) * PAGE_SIZE),
          lastIndex: String(pageNo * PAGE_SIZE),
          srchCltrType: type.code,
          srchPrptType: SEIZED,
          srchDspsMthod: SALE,
          srchRspbSbr: office.code,
          srchBidPerdType: "0004", // 직접 입력
          srchBidPerdBgngDt: today,
          srchBidPerdEndDt: addDays(today, 365),
          srchSortType: "ASC",
          srchWordType: "0001",
          searchCltrMnmtNoYn: "N",
        });
        requests++;
        if (pageNo === 1) rowCount[type.name] = page.rowCount;
        received += page.items.length;

        for (const raw of page.items) {
          if (raw.cltrPrptDivCd && raw.cltrPrptDivCd !== SEIZED) continue; // 압류재산만
          const status = raw.pbctCltrStatNm ?? raw.pbancPbctCltrStatNm ?? "";
          if (!OPEN_STATUSES.has(status)) {
            closed++;
            continue;
          }
          const itemNo = raw.scrnIndctCltrMngNo?.trim();
          if (!itemNo) throw new CollectError("format", `${type.name}: 물건관리번호가 없는 물건이 있습니다`);
          const failText = raw.uscbdCnt === null || raw.uscbdCnt === undefined ? "" : String(raw.uscbdCnt).trim();
          const failCount = Number(failText);
          if (failText === "" || !Number.isInteger(failCount) || failCount < 0) {
            invalidFailCount++;
            continue;
          }
          if (byItemNo.has(itemNo)) {
            duplicates++;
            continue;
          }
          byItemNo.set(itemNo, {
            itemNo,
            regionOffice: office.name,
            category: topCategory(raw.ctgrFullNm),
            failCount,
            collectedOn: today,
          });
        }

        if (received >= page.rowCount) break;
        // 전체 건수에 못 미쳤는데 빈 페이지가 오면 "일부만 받은 것"이므로 실패
        if (page.items.length === 0) {
          throw new CollectError("format", `${type.name}: ${page.rowCount}건 중 ${received}건만 받았습니다`);
        }
      }
    }

    return {
      ok: true,
      office: office.name,
      items: [...byItemNo.values()],
      stats: { rowCount, closed, duplicates, invalidFailCount, requests, ms: Date.now() - started },
    };
  } catch (error) {
    if (error instanceof CollectError) return { ok: false, office: office.name, reason: error.reason, message: error.message };
    return {
      ok: false,
      office: office.name,
      reason: "http",
      message:
        error instanceof Error && error.name === "TimeoutError"
          ? `요청 시간 초과 (${REQUEST_TIMEOUT_MS / 1000}초)`
          : `요청 실패: ${error instanceof Error ? error.message : "알 수 없음"}`,
    };
  }
}
