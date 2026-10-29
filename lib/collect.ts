// 주간 수집 한 걸음 (PLAN 작업 20 / DESIGN 3.1, 9장 ⑪·⑬ / PRD 5장 must ②)
// 예약 실행(월~금 09:00~10:55, 5분마다 하루 24번)이 부를 때마다 아래를 한 번 한다.
//   0) 수집 잠금을 얻는다 — 다른 수집(예약 실행·다시 가져오기 버튼)이 돌고 있으면 바로 끝낸다
//   1) 이번 주(한국 시간)가 이미 성공이면 아무것도 안 하고 끝
//   2) 오늘 아직 안 받은 지역본부 1곳을 온비드에서 받는다
//   3) 실패하면(온비드 오류·시간 초과·저장소 오류 모두) "재시도 중"을 기록한다 — 다음 차례에 같은 지역본부를 다시 받는다
//   4) 성공하면 임시 보관하고, 12곳이 모이면 그 주 기록으로 한 번에 확정한다
// 금요일 11:05에는 finalizeWeekIfUnfinished가 아직 성공 못 한 주를 "실패"로 바꾼다 (그때부터 실패 안내가 보임).
// PLAN 작업 21의 "지금 다시 가져오기" 버튼도 runCollectStep을 쓴다.

import "server-only";
import { randomUUID } from "node:crypto";
import { REGION_OFFICES } from "./known-values";
import { collectOffice } from "./onbid/client";
import {
  acquireCollectLock,
  finalizeWeek,
  listSnapshots,
  recordFailure,
  releaseCollectLock,
  stageOffice,
  stagedOffices,
} from "./db/snapshots";
import { failedWeekToShow } from "./collect-status";
import { currentFiscalWeek, fiscalWeekFromNumber, toKstDate, type FiscalWeek } from "./week";

/** 수집 잠금이 저절로 풀리는 시간. 수집 경로의 최대 실행 시간(120초)보다 길게 */
const LOCK_SECONDS = 150;

export type CollectStepResult =
  | { status: "skipped"; reason: "already-success"; week: FiscalWeek }
  | { status: "staged"; week: FiscalWeek; office: string; items: number; staged: number; total: number }
  | { status: "saved"; week: FiscalWeek; office: string; items: number }
  | { status: "failed"; week: FiscalWeek; office: string; reason: string; message: string }
  | { status: "busy"; message: string }
  | { status: "marked-failed"; week: FiscalWeek }
  | { status: "refused"; message: string };

/** 잠금을 얻은 동안만 fn을 실행한다. 다른 수집이 돌고 있으면 busy */
async function withCollectLock<T>(fn: () => Promise<T>): Promise<T | { status: "busy"; message: string }> {
  const holder = randomUUID();
  if (!(await acquireCollectLock(holder, LOCK_SECONDS))) {
    return { status: "busy", message: "다른 수집이 진행 중입니다" };
  }
  try {
    return await fn();
  } finally {
    await releaseCollectLock(holder).catch(() => {}); // 못 풀어도 150초 뒤 저절로 풀림
  }
}

/**
 * 수집 한 걸음.
 * @param now 지금 시각 (이번 주·오늘 계산용)
 * @param target 다른 주로 저장할 때(다시 가져오기 버튼: 실패한 그 주) 그 주. 없으면 이번 주
 */
export async function runCollectStep(now: Date = new Date(), target?: FiscalWeek): Promise<CollectStepResult> {
  const week = target ?? currentFiscalWeek(now);
  const today = toKstDate(now);

  return withCollectLock(async (): Promise<CollectStepResult> => {
    let office = "-";
    try {
      // 잠금을 얻은 뒤에 확인해야, 방금 끝난 다른 수집이 확정한 주에 다시 보관하지 않는다
      const snapshots = await listSnapshots();
      const current = snapshots.find((s) => s.fiscalYear === week.fiscalYear && s.weekNo === week.weekNo);
      if (current?.status === "success") return { status: "skipped", reason: "already-success", week };

      const done = new Set(await stagedOffices(week, today));
      const next = REGION_OFFICES.find((o) => !done.has(o.name));
      // 12곳이 모두 보관됐는데 확정이 안 된 경우(확정 중 오류)는 확정만 다시 한다
      if (!next) {
        const items = await finalizeWeek(week, today);
        return { status: "saved", week, office: "-", items };
      }
      office = next.name;

      const result = await collectOffice(next.code, { now });
      if (!result.ok) {
        await markRetrying(week, target);
        return { status: "failed", week, office: result.office, reason: result.reason, message: result.message };
      }

      const staged = await stageOffice(week, today, result.office, result.items);
      if (staged < REGION_OFFICES.length) {
        return { status: "staged", week, office: result.office, items: result.items.length, staged, total: REGION_OFFICES.length };
      }
      const items = await finalizeWeek(week, today);
      return { status: "saved", week, office: result.office, items };
    } catch (error) {
      // 저장소 오류 등 예상 못 한 실패도 기록해, 금요일 마무리에서 "실패"로 보이게 한다
      await markRetrying(week, target).catch(() => {});
      return {
        status: "failed",
        week,
        office,
        reason: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  });
}

/**
 * 실패를 "재시도 중"으로 남긴다. 요일과 상관없이 retrying이고, "실패"는 금요일 마무리만 정한다.
 * 다시 가져오기 버튼(target이 있음)은 이미 "실패"인 주를 다루므로 상태를 바꾸지 않는다
 * (retrying으로 바꾸면 실패 안내와 버튼이 사라지기 때문).
 */
async function markRetrying(week: FiscalWeek, target?: FiscalWeek): Promise<void> {
  if (target) return;
  await recordFailure(week, "retrying");
}

/**
 * 금요일 마무리 (예약 실행: 금요일 11:05 한국 시간).
 * 이번 주가 아직 성공하지 못했으면(재시도 중이거나, 예약 실행이 한 번도 돌지 못해 기록이 없어도) "실패"로 바꾼다.
 * 이때부터 그 주 일요일까지 실패 안내와 "지금 다시 가져오기" 버튼이 보인다.
 */
export async function finalizeWeekIfUnfinished(now: Date = new Date()): Promise<CollectStepResult> {
  const week = currentFiscalWeek(now);
  return withCollectLock(async (): Promise<CollectStepResult> => {
    const current = (await listSnapshots()).find((s) => s.fiscalYear === week.fiscalYear && s.weekNo === week.weekNo);
    if (current?.status === "success") return { status: "skipped", reason: "already-success", week };
    await recordFailure(week, "failed");
    return { status: "marked-failed", week };
  });
}

/**
 * "지금 다시 가져오기" 버튼의 한 걸음 (PLAN 작업 21 / DESIGN 3.3).
 * 이번 주가 금요일 마무리에서 "실패"가 된 경우에만, 그 주 일요일까지, 실패한 그 주로 저장한다.
 * 한 번 부르면 지역본부 1곳을 받는다. 화면은 12곳이 모일 때까지 되풀이해 부른다.
 */
export async function retryFailedWeek(now: Date = new Date()): Promise<CollectStepResult> {
  const failed = failedWeekToShow(await listSnapshots(), now);
  if (!failed) return { status: "refused", message: "다시 가져올 실패한 주가 없습니다" };
  return runCollectStep(now, fiscalWeekFromNumber(failed.fiscalYear, failed.weekNo));
}
