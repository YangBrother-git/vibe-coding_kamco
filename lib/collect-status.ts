// 수집 상태로 화면에 보여 줄 것 정하기 (DESIGN 2.1 ①②, 6장 / PRD 5장 must ②)
// - 실패 안내: 이번 주가 금요일까지 모두 실패(failed)했을 때만, 그 주 일요일까지 보인다.
//   월~목 재시도 중(retrying)에는 보이지 않는다.
// - 마지막 성공 수집: 가장 최근에 성공한 주의 성공 시각.
// 지금 시각을 인자로 받는 순수 계산이라, 날짜를 바꿔 가며 확인할 수 있다.

import type { DateTimeString, WeeklySnapshot } from "./types";
import { currentFiscalWeek, kstWeekday, toKstDate } from "./week";

const WEEKDAY_NAMES = ["월", "화", "수", "목", "금", "토", "일"];

/** 실패 안내를 띄울 주. 없으면 null */
export function failedWeekToShow(
  snapshots: readonly WeeklySnapshot[],
  now: Date,
): WeeklySnapshot | null {
  // "이번 주" = 지금(한국 시간)이 들어 있는 주. 주가 바뀌면(월요일) 지난주 실패 안내는 사라진다.
  const { fiscalYear, weekNo } = currentFiscalWeek(now);
  return (
    snapshots.find((s) => s.fiscalYear === fiscalYear && s.weekNo === weekNo && s.status === "failed") ?? null
  );
}

/** 가장 최근에 성공한 주. 없으면 null */
export function latestSuccess(snapshots: readonly WeeklySnapshot[]): WeeklySnapshot | null {
  const successes = snapshots
    .filter((s) => s.status === "success")
    .sort((a, b) => a.fiscalYear - b.fiscalYear || a.weekNo - b.weekNo);
  return successes.at(-1) ?? null;
}

/** 시각을 한국 시간 `2026-10-19(월) 09:02` 꼴로 */
export function formatKstDateTime(value: DateTimeString): string {
  const instant = new Date(value);
  const kst = new Date(instant.getTime() + 9 * 60 * 60 * 1000).toISOString();
  return `${toKstDate(instant)}(${WEEKDAY_NAMES[kstWeekday(instant) - 1]}) ${kst.slice(11, 16)}`;
}
