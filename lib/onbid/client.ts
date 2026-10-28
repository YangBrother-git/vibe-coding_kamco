// 온비드 공개 API로 압류재산 물건 모으기 (PLAN 작업 16 / DESIGN 3.1 / PRD 5장 must ②)
// - 차세대 온비드 부동산·동산·차량 물건목록 조회서비스 3곳에서, 압류재산(0007)·매각만 받는다.
//   이 서비스들은 "입찰 중이거나 입찰 예정인 물건"만 돌려준다.
// - 필수 조건인 수의계약가능여부(Y/N)가 하나만 고를 수 있어, 서비스마다 두 번씩 부른다.
// - 모든 페이지를 끝까지 받는다. 한 번이라도 실패하거나 한도에 걸리면 전부 버리고 실패로 돌려준다
//   (일부만 저장하면 숫자가 틀려지므로).
// - 물건마다 5가지 항목만 남기고 나머지(의뢰기관·주소 등)는 버린다.
//
// ⚠ 아직 실제 응답으로 확인하지 못한 부분 (PLAN 작업 14에서 확인)
//   - 지역본부: 공고기관명(orgNm) 안에서 알려진 지역본부 이름을 찾는다. 실제 표기와 다르면 고친다.
//   - 한 페이지 최대 건수, 응답 JSON의 정확한 겉모양.

import "server-only";
import { KNOWN_REGION_OFFICES } from "../known-values";
import type { AuctionItem } from "../types";
import { toKstDate } from "../week";

const SERVICES = [
  { name: "부동산", url: "https://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2" },
  { name: "동산", url: "https://apis.data.go.kr/B010003/OnbidMvastListSrvc2/getMvastCltrList2" },
  { name: "차량", url: "https://apis.data.go.kr/B010003/OnbidCarListSrvc2/getCarCltrList2" },
] as const;

const SEIZED = "0007"; // 재산유형: 압류재산
const SALE = "0001"; // 처분방식: 매각
const PAGE_SIZE = 100;
const MAX_PAGES = 500; // 응답이 이상해 끝없이 넘기는 일을 막는 안전장치

/** 수집 실패 이유 */
export type CollectFailure =
  | "no-key" // .env에 키가 없음
  | "quota" // 하루·초당 호출 한도 초과 (오류코드 22·23)
  | "auth" // 등록되지 않았거나 만료된 키 (오류코드 20·30·31)
  | "http" // 응답 자체가 실패
  | "format"; // 응답 모양을 읽을 수 없음

export type CollectResult =
  | {
      ok: true;
      items: AuctionItem[];
      stats: {
        /** 서비스별 API가 알려 준 전체 건수 (수의계약 N+Y 합) */
        totalCount: Record<string, number>;
        /** 같은 물건번호가 여러 번 와서 빼 낸 건수 */
        duplicates: number;
        /** 유찰 횟수가 숫자가 아니어서 뺀 건수 (짐작해서 채우지 않음) */
        invalidFailCount: number;
        requests: number;
        ms: number;
      };
    }
  | { ok: false; reason: CollectFailure; message: string };

/** API 응답 item 중 이 앱이 읽는 항목 */
type RawItem = {
  cltrMngNo?: string;
  prptDivCd?: string;
  orgNm?: string;
  cltrUsgLclsCtgrNm?: string;
  usbdNft?: number | string;
};

class CollectError extends Error {
  constructor(
    readonly reason: CollectFailure,
    message: string,
  ) {
    super(message);
  }
}

/** 포털은 "인코딩 키"(이미 % 로 바뀐 것)와 "디코딩 키"를 준다. 어느 쪽이든 한 번만 인코딩되게 맞춘다. */
function encodedServiceKey(): string {
  const key = process.env.ONBID_API_KEY?.trim();
  if (!key) throw new CollectError("no-key", "ONBID_API_KEY가 .env에 없습니다");
  return key.includes("%") ? key : encodeURIComponent(key);
}

/** 공고기관명에서 지역본부 이름 찾기. 못 찾으면 원본 그대로 둔다(셀 때 "기타"가 된다). */
export function regionFromOrgName(orgNm: string | undefined): string | null {
  const name = orgNm?.replace(/\s+/g, "") ?? "";
  if (!name) return null;
  return KNOWN_REGION_OFFICES.find((office) => name.includes(office)) ?? orgNm!.trim();
}

/** 응답에서 오류코드 꺼내기 (게이트웨이 오류와 서비스 오류 모양이 다름) */
function errorCode(json: unknown): string | null {
  const j = json as {
    OpenAPI_ServiceResponse?: { cmmMsgHeader?: { returnReasonCode?: string } };
    header?: { resultCode?: string };
    response?: { header?: { resultCode?: string } };
  };
  const gateway = j.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnReasonCode;
  if (gateway) return gateway;
  const code = j.header?.resultCode ?? j.response?.header?.resultCode;
  return code && code !== "00" && code !== "0" ? code : null;
}

function failureFor(code: string): CollectFailure {
  if (code === "22" || code === "23") return "quota";
  if (code === "20" || code === "30" || code === "31") return "auth";
  return "http";
}

async function fetchPage(
  fetchImpl: typeof fetch,
  url: string,
  key: string,
  pvctTrgtYn: "N" | "Y",
  pageNo: number,
): Promise<{ totalCount: number; items: RawItem[] }> {
  const query = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    resultType: "json",
    prptDivCd: SEIZED,
    pvctTrgtYn,
    dspsMthodCd: SALE,
  });
  // 키는 이미 인코딩돼 있어 URLSearchParams에 넣지 않는다 (두 번 인코딩 방지)
  const res = await fetchImpl(`${url}?serviceKey=${key}&${query}`, { cache: "no-store" });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new CollectError("format", `JSON이 아닌 응답 (HTTP ${res.status})`);
  }
  const code = errorCode(json);
  if (code) throw new CollectError(failureFor(code), `API 오류코드 ${code} (HTTP ${res.status})`);
  if (!res.ok) throw new CollectError("http", `HTTP ${res.status}`);

  const j = json as { body?: Body; response?: { body?: Body } };
  type Body = { totalCount?: number | string; items?: { item?: RawItem | RawItem[] } | "" };
  const body = j.body ?? j.response?.body;
  const totalCount = Number(body?.totalCount);
  if (!body || !Number.isInteger(totalCount)) throw new CollectError("format", "응답에 totalCount가 없습니다");
  const raw = body.items && typeof body.items === "object" ? body.items.item : undefined;
  return { totalCount, items: raw === undefined ? [] : Array.isArray(raw) ? raw : [raw] };
}

/**
 * 압류재산 물건 전체 수집.
 * @param now 수집 시각 (수집일 계산용)
 * @param fetchImpl 시험할 때 가짜 응답을 넣기 위한 자리
 */
export async function collectSeizedItems(
  now: Date = new Date(),
  fetchImpl: typeof fetch = fetch,
): Promise<CollectResult> {
  const started = Date.now();
  try {
    const key = encodedServiceKey();
    const collectedOn = toKstDate(now);
    const byItemNo = new Map<string, AuctionItem>();
    const totalCount: Record<string, number> = {};
    let duplicates = 0;
    let invalidFailCount = 0;
    let requests = 0;

    for (const service of SERVICES) {
      for (const pvct of ["N", "Y"] as const) {
        let received = 0;
        for (let pageNo = 1; ; pageNo++) {
          if (pageNo > MAX_PAGES) throw new CollectError("format", `${service.name}: 페이지가 너무 많습니다`);
          const page = await fetchPage(fetchImpl, service.url, key, pvct, pageNo);
          requests++;
          if (pageNo === 1) totalCount[service.name] = (totalCount[service.name] ?? 0) + page.totalCount;
          received += page.items.length;

          for (const raw of page.items) {
            if (raw.prptDivCd && raw.prptDivCd !== SEIZED) continue; // 압류재산만
            const itemNo = raw.cltrMngNo?.trim();
            if (!itemNo) throw new CollectError("format", `${service.name}: 물건관리번호가 없는 물건이 있습니다`);
            const failCount = Number(raw.usbdNft);
            if (raw.usbdNft === undefined || raw.usbdNft === "" || !Number.isInteger(failCount) || failCount < 0) {
              invalidFailCount++;
              continue;
            }
            if (byItemNo.has(itemNo)) {
              duplicates++;
              continue;
            }
            byItemNo.set(itemNo, {
              itemNo,
              regionOffice: regionFromOrgName(raw.orgNm),
              category: raw.cltrUsgLclsCtgrNm?.trim() || null,
              failCount,
              collectedOn,
            });
          }

          if (received >= page.totalCount) break;
          // 전체 건수에 못 미쳤는데 빈 페이지가 오면 "일부만 받은 것"이므로 실패
          if (page.items.length === 0) {
            throw new CollectError("format", `${service.name}: ${page.totalCount}건 중 ${received}건만 받았습니다`);
          }
        }
      }
    }

    return {
      ok: true,
      items: [...byItemNo.values()],
      stats: { totalCount, duplicates, invalidFailCount, requests, ms: Date.now() - started },
    };
  } catch (error) {
    if (error instanceof CollectError) return { ok: false, reason: error.reason, message: error.message };
    // 네트워크 끊김 등. 메시지에 주소(키 포함)가 섞이지 않게 이름만 남긴다.
    return { ok: false, reason: "http", message: `요청 실패: ${error instanceof Error ? error.name : "알 수 없음"}` };
  }
}
