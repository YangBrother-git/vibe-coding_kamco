// 가짜 데이터 (PLAN 작업 6 / DESIGN 10장)
// 온비드 연결 전에 화면을 그리고 예외 상황을 눈으로 확인하기 위한 데이터다.
// 저장소가 연결되면(PLAN 작업 19) 화면은 이 파일 대신 저장된 데이터를 읽는다.
//
// 2026 회계연도에 담긴 상황:
// - 39·40·43주차: 성공 (물건이 있는 3주 치)
// - 41주차: 실패 (금요일까지 모두 실패, 물건 없음)
// - 42주차: 수집 안 된 주 (기록 자체가 없음)
// - 44주차: 재시도 중 (월~수 실패, 물건 없음)
// - 지역본부 3곳(서울·부산울산·인천) + 지역 없음·처음 보는 지역 → "기타" 지역
// - 목록에 없는 용도("선박")·용도 없음 → "기타" 줄
// - 0건 칸, 5회 이상 칸, 51건 이상이 되는 칸(전국 합계)
// - 2025 회계연도는 데이터 없음 → "비교할 지난해 데이터 없음" 확인용

import type { AuctionItem, WeeklySnapshot } from "./types";
import { fiscalWeekFromNumber } from "./week";

const FISCAL_YEAR = 2026;

/** 용도별 유찰 0회·1회·2회·3회·4회·5회 이상 건수 */
type CategoryCounts = Record<string, number[]>;
/** 지역본부별 용도별 건수. 키 "" 는 지역 없음(null), 용도 키 "" 는 용도 없음(null) */
type WeekSpec = Record<string, CategoryCounts>;

const SUCCESS_WEEKS: Record<number, WeekSpec> = {
  39: {
    서울지역본부: {
      토지: [15, 26, 6, 2, 0, 0],
      건물: [7, 18, 30, 4, 1, 0],
      "차량·운송장비": [1, 2, 0, 0, 0, 0],
    },
    부산울산지역본부: {
      토지: [9, 12, 4, 1, 0, 0],
      건물: [5, 9, 18, 6, 2, 1],
    },
    인천지역본부: {
      토지: [4, 5, 1, 0, 0, 0],
      건물: [3, 4, 9, 2, 0, 0],
    },
  },
  40: {
    서울지역본부: {
      토지: [14, 28, 7, 2, 1, 0],
      건물: [6, 20, 35, 5, 1, 0],
      "차량·운송장비": [0, 3, 1, 0, 0, 0],
      선박: [1, 0, 0, 0, 0, 0],
    },
    부산울산지역본부: {
      토지: [8, 14, 5, 2, 0, 0],
      건물: [4, 10, 21, 8, 2, 1],
      "기계·물품": [1, 1, 0, 0, 0, 0],
    },
    인천지역본부: {
      토지: [3, 6, 2, 0, 0, 0],
      건물: [2, 5, 10, 3, 1, 0],
    },
    "": { 토지: [1, 0, 0, 0, 0, 0] },
  },
  43: {
    서울지역본부: {
      토지: [12, 30, 8, 3, 0, 1],
      건물: [5, 22, 41, 6, 2, 0],
      "차량·운송장비": [0, 3, 1, 0, 0, 0],
      선박: [1, 0, 0, 0, 0, 0],
    },
    부산울산지역본부: {
      토지: [8, 15, 6, 2, 1, 0],
      건물: [4, 10, 25, 9, 3, 3],
      "기계·물품": [2, 1, 0, 0, 0, 0],
      "": [0, 1, 0, 0, 0, 0],
    },
    인천지역본부: {
      토지: [3, 6, 2, 0, 0, 0],
      건물: [2, 5, 12, 4, 1, 0],
      회원권: [0, 1, 0, 0, 0, 0],
    },
    "": { 토지: [1, 0, 0, 0, 0, 0] },
    세종지역본부: { 건물: [0, 1, 0, 0, 0, 0] },
  },
};

/** 시각 문자열 (한국 시간) */
function kst(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}

/** 날짜에 며칠 더하기 */
function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 표(WeekSpec)를 물건 목록으로 펼친다. 5회 이상 칸은 5·6·7회를 돌아가며 넣는다. */
function expand(weekNo: number, spec: WeekSpec, collectedOn: string): AuctionItem[] {
  const items: AuctionItem[] = [];
  for (const [region, categories] of Object.entries(spec)) {
    for (const [category, counts] of Object.entries(categories)) {
      counts.forEach((count, bucket) => {
        for (let i = 0; i < count; i++) {
          items.push({
            itemNo: `MOCK-${FISCAL_YEAR}-${weekNo}-${String(items.length + 1).padStart(4, "0")}`,
            regionOffice: region === "" ? null : region,
            category: category === "" ? null : category,
            failCount: bucket === 5 ? 5 + (i % 3) : bucket,
            collectedOn,
          });
        }
      });
    }
  }
  return items;
}

const itemsByWeek = new Map<string, AuctionItem[]>();
const snapshots: WeeklySnapshot[] = [];

for (const [weekText, spec] of Object.entries(SUCCESS_WEEKS)) {
  const weekNo = Number(weekText);
  const { weekStart } = fiscalWeekFromNumber(FISCAL_YEAR, weekNo);
  const items = expand(weekNo, spec, weekStart);
  itemsByWeek.set(`${FISCAL_YEAR}-${weekNo}`, items);
  snapshots.push({
    fiscalYear: FISCAL_YEAR,
    weekNo,
    weekStart,
    status: "success",
    lastAttemptAt: kst(weekStart, "09:02"),
    succeededAt: kst(weekStart, "09:02"),
    attempts: 1,
    itemCount: items.length,
  });
}

// 41주차: 월~금 다섯 번 모두 실패
{
  const { weekStart } = fiscalWeekFromNumber(FISCAL_YEAR, 41);
  snapshots.push({
    fiscalYear: FISCAL_YEAR,
    weekNo: 41,
    weekStart,
    status: "failed",
    lastAttemptAt: kst(addDays(weekStart, 4), "09:00"),
    succeededAt: null,
    attempts: 5,
    itemCount: 0,
  });
}

// 44주차: 월·화·수 실패, 목요일에 다시 시도할 예정
{
  const { weekStart } = fiscalWeekFromNumber(FISCAL_YEAR, 44);
  snapshots.push({
    fiscalYear: FISCAL_YEAR,
    weekNo: 44,
    weekStart,
    status: "retrying",
    lastAttemptAt: kst(addDays(weekStart, 2), "09:00"),
    succeededAt: null,
    attempts: 3,
    itemCount: 0,
  });
}

snapshots.sort((a, b) => a.fiscalYear - b.fiscalYear || a.weekNo - b.weekNo);

/** 가짜 주간 기록 전체 (회계연도·주차 순) */
export const MOCK_SNAPSHOTS: readonly WeeklySnapshot[] = snapshots;

/** 가짜 물건 목록. 성공하지 않은 주나 없는 주는 빈 목록 */
export function getMockItems(fiscalYear: number, weekNo: number): AuctionItem[] {
  return itemsByWeek.get(`${fiscalYear}-${weekNo}`) ?? [];
}
