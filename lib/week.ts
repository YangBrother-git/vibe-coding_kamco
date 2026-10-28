// 주차·회계연도 계산 (DESIGN 3.5, 9장 ⑥ / PRD 5장 must ①)
// - 주는 월요일~일요일로 센다.
// - 1월 1일이 들어 있는 주가 1주차이고, 그 주는 12월 날짜가 섞여 있어도 새 회계연도에 속한다.
//   예: 2027-12-27(월)~2028-01-02(일)은 2028 회계연도 1주차.
// - 모든 날짜는 한국 시간 기준이다 (서버는 세계 표준시로 돌기 때문).
// 화면·저장소와 상관없는 순수 계산이라, 같은 입력이면 언제나 같은 결과를 낸다.

import type { DateString } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 한 회계연도 안의 한 주 */
export type FiscalWeek = {
  fiscalYear: number;
  /** 1부터 시작, 최대 53 */
  weekNo: number;
  /** 그 주 월요일 */
  weekStart: DateString;
  /** 그 주 일요일 */
  weekEnd: DateString;
};

// --- 날짜 문자열 ↔ 날짜 수 변환 (시간대 영향을 받지 않도록 UTC 자정으로 다룬다) ---

function toDayNumber(date: DateString): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`날짜 형식이 올바르지 않습니다: ${date}`);
  const [, y, m, d] = match.map(Number);
  const ms = Date.UTC(y, m - 1, d);
  // 2026-02-30처럼 없는 날짜는 다음 달로 넘어가므로 되돌려 비교해 걸러 낸다
  if (fromDayNumber(ms / DAY_MS) !== date) {
    throw new Error(`없는 날짜입니다: ${date}`);
  }
  return ms / DAY_MS;
}

function fromDayNumber(day: number): DateString {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** 그 날짜가 들어 있는 주의 월요일 (날짜 수) */
function mondayOf(day: number): number {
  // 1970-01-01은 목요일이므로 (day + 3) % 7 이 월요일 기준 0~6이 된다
  const weekday = (((day + 3) % 7) + 7) % 7;
  return day - weekday;
}

/** 그 회계연도 1주차의 월요일 = 1월 1일이 들어 있는 주의 월요일 (날짜 수) */
function firstMondayOf(fiscalYear: number): number {
  return mondayOf(Date.UTC(fiscalYear, 0, 1) / DAY_MS);
}

// --- 내보내는 함수 ---

/** 어떤 순간(Date)의 한국 시간 날짜 */
export function toKstDate(instant: Date): DateString {
  return new Date(instant.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 그 날짜가 속한 회계연도와 주차 */
export function fiscalWeekOf(date: DateString): FiscalWeek {
  const monday = mondayOf(toDayNumber(date));
  // 그 주 일요일이 속한 해가 회계연도다.
  // 주 안에 1월 1일이 있으면 일요일은 이미 새해이므로 새 회계연도가 된다.
  const fiscalYear = new Date((monday + 6) * DAY_MS).getUTCFullYear();
  const weekNo = (monday - firstMondayOf(fiscalYear)) / 7 + 1;
  return {
    fiscalYear,
    weekNo,
    weekStart: fromDayNumber(monday),
    weekEnd: fromDayNumber(monday + 6),
  };
}

/** 지금(또는 주어진 순간)이 속한 회계연도와 주차, 한국 시간 기준 */
export function currentFiscalWeek(now: Date = new Date()): FiscalWeek {
  return fiscalWeekOf(toKstDate(now));
}

/** 그 회계연도의 주 수 (52 또는 53) */
export function weeksInFiscalYear(fiscalYear: number): number {
  return (firstMondayOf(fiscalYear + 1) - firstMondayOf(fiscalYear)) / 7;
}

/** 회계연도와 주차로 그 주의 월요일·일요일 찾기 */
export function fiscalWeekFromNumber(fiscalYear: number, weekNo: number): FiscalWeek {
  const total = weeksInFiscalYear(fiscalYear);
  if (!Number.isInteger(weekNo) || weekNo < 1 || weekNo > total) {
    throw new Error(`${fiscalYear} 회계연도에는 1~${total}주차만 있습니다: ${weekNo}`);
  }
  const monday = firstMondayOf(fiscalYear) + (weekNo - 1) * 7;
  return {
    fiscalYear,
    weekNo,
    weekStart: fromDayNumber(monday),
    weekEnd: fromDayNumber(monday + 6),
  };
}

/** 한국 시간 기준 요일 (1 = 월요일 … 7 = 일요일) */
export function kstWeekday(instant: Date): number {
  const day = toDayNumber(toKstDate(instant));
  return day - mondayOf(day) + 1;
}
