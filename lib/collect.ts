// 주간 수집 한 걸음 (PLAN 작업 20 / DESIGN 3.1, 9장 ⑪ / PRD 5장 must ②)
// 예약 실행(월~금 09:00~09:55, 5분마다)이 부를 때마다 아래를 한 번 한다.
//   1) 이번 주(한국 시간)가 이미 성공이면 아무것도 안 하고 끝
//   2) 오늘 아직 안 받은 지역본부 1곳을 온비드에서 받는다
//   3) 실패하면 실패를 기록한다 (월~목: retrying, 금: failed) — 다음 차례에 같은 지역본부를 다시 받는다
//   4) 성공하면 임시 보관하고, 12곳이 모이면 그 주 기록으로 한 번에 확정한다
// PLAN 작업 21의 "지금 다시 가져오기" 버튼도 이 함수를 쓴다.

import "server-only";
import { REGION_OFFICES } from "./known-values";
import { collectOffice } from "./onbid/client";
import { finalizeWeek, listSnapshots, recordFailure, stageOffice, stagedOffices } from "./db/snapshots";
import { currentFiscalWeek, kstWeekday, toKstDate, type FiscalWeek } from "./week";

export type CollectStepResult =
  | { status: "skipped"; reason: "already-success"; week: FiscalWeek }
  | { status: "staged"; week: FiscalWeek; office: string; items: number; staged: number; total: number }
  | { status: "saved"; week: FiscalWeek; office: string; items: number }
  | { status: "failed"; week: FiscalWeek; office: string; reason: string; message: string };

/**
 * 수집 한 걸음.
 * @param now 지금 시각 (이번 주·오늘 계산용)
 * @param target 다른 주로 저장할 때(다시 가져오기 버튼: 실패한 그 주) 그 주. 없으면 이번 주
 */
export async function runCollectStep(now: Date = new Date(), target?: FiscalWeek): Promise<CollectStepResult> {
  const week = target ?? currentFiscalWeek(now);
  const today = toKstDate(now);

  const snapshots = await listSnapshots();
  const current = snapshots.find((s) => s.fiscalYear === week.fiscalYear && s.weekNo === week.weekNo);
  if (current?.status === "success") return { status: "skipped", reason: "already-success", week };

  const done = new Set(await stagedOffices(week, today));
  // 12곳이 모두 보관됐는데 확정이 안 된 경우(확정 중 오류)는 확정만 다시 한다
  const next = REGION_OFFICES.find((office) => !done.has(office.name));
  if (!next) {
    const items = await finalizeWeek(week, today);
    return { status: "saved", week, office: "-", items };
  }

  const result = await collectOffice(next.code, { now });
  if (!result.ok) {
    // 금요일(5)에 실패하면 그 주는 실패, 그 전에는 다음 날 다시 시도할 예정
    await recordFailure(week, kstWeekday(now) >= 5 ? "failed" : "retrying");
    return { status: "failed", week, office: result.office, reason: result.reason, message: result.message };
  }

  const staged = await stageOffice(week, today, result.office, result.items);
  if (staged < REGION_OFFICES.length) {
    return { status: "staged", week, office: result.office, items: result.items.length, staged, total: REGION_OFFICES.length };
  }
  const items = await finalizeWeek(week, today);
  return { status: "saved", week, office: result.office, items };
}
