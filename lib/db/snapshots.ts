// 주간 기록·물건 읽기/쓰기 (PLAN 작업 18 / DESIGN 4.1, 9장 ⑪)
// - 쓰기: 지역본부 1곳씩 임시 보관(stageOffice) → 12곳이 모이면 한 번에 확정(finalizeWeek).
//   확정은 Supabase 함수 save_snapshot 하나로 해서, 중간에 실패하면 아무것도 바뀌지 않는다.
// - 실패한 날은 recordFailure로 남긴다 (이미 성공한 주는 건드리지 않음).
// - 읽기: 주간 기록 목록, 한 주의 물건 목록.

import "server-only";
import { REGION_OFFICES } from "../known-values";
import type { AuctionItem, DateString, SnapshotStatus, WeeklySnapshot } from "../types";
import type { FiscalWeek } from "../week";
import { db } from "./client";

/** 한 번에 읽는 줄 수 (Supabase 기본 최대치 1,000줄에 맞춤) */
const READ_PAGE = 1000;

type SnapshotRow = {
  fiscal_year: number;
  week_no: number;
  week_start: string;
  status: SnapshotStatus;
  last_attempt_at: string | null;
  succeeded_at: string | null;
  attempts: number;
  item_count: number;
};

type ItemRow = {
  item_no: string;
  region_office: string | null;
  category: string | null;
  fail_count: number;
  collected_on: string;
};

function toSnapshot(row: SnapshotRow): WeeklySnapshot {
  return {
    fiscalYear: row.fiscal_year,
    weekNo: row.week_no,
    weekStart: row.week_start,
    status: row.status,
    lastAttemptAt: row.last_attempt_at,
    succeededAt: row.succeeded_at,
    attempts: row.attempts,
    itemCount: row.item_count,
  };
}

/**
 * 지역본부 1곳의 수집 결과를 임시 보관한다.
 * @returns 오늘 그 주에 임시 보관된 지역본부 수 (12가 되면 finalizeWeek를 부른다)
 */
export async function stageOffice(
  week: FiscalWeek,
  collectedOn: DateString,
  office: string,
  items: readonly AuctionItem[],
): Promise<number> {
  const { data, error } = await db().rpc("stage_office", {
    p_fiscal_year: week.fiscalYear,
    p_week_no: week.weekNo,
    p_collected_on: collectedOn,
    p_office: office,
    p_items: items.map((item) => ({
      item_no: item.itemNo,
      region_office: item.regionOffice,
      category: item.category,
      fail_count: item.failCount,
    })),
  });
  if (error) throw new Error(`임시 보관 실패 (${office}): ${error.message}`);
  return data as number;
}

/**
 * 오늘 임시 보관된 12개 지역본부 결과로 그 주 기록을 한 번에 확정한다.
 * 12곳이 다 모이지 않았으면 오류가 나고 아무것도 바뀌지 않는다.
 * @returns 저장한 물건 수
 */
export async function finalizeWeek(week: FiscalWeek, collectedOn: DateString): Promise<number> {
  const { data, error } = await db().rpc("save_snapshot", {
    p_fiscal_year: week.fiscalYear,
    p_week_no: week.weekNo,
    p_week_start: week.weekStart,
    p_collected_on: collectedOn,
    p_expected_offices: REGION_OFFICES.length,
  });
  if (error) throw new Error(`주간 기록 확정 실패: ${error.message}`);
  return data as number;
}

/** 수집이 실패한 날을 기록한다 (월~목: retrying, 금: failed). 이미 성공한 주는 그대로 둔다. */
export async function recordFailure(week: FiscalWeek, status: "retrying" | "failed"): Promise<void> {
  const { error } = await db().rpc("record_failure", {
    p_fiscal_year: week.fiscalYear,
    p_week_no: week.weekNo,
    p_week_start: week.weekStart,
    p_status: status,
  });
  if (error) throw new Error(`실패 기록 실패: ${error.message}`);
}

/** 그날 그 주에 이미 임시 보관된 지역본부 이름들 */
export async function stagedOffices(week: FiscalWeek, collectedOn: DateString): Promise<string[]> {
  const { data, error } = await db()
    .from("staged_offices")
    .select("office")
    .eq("fiscal_year", week.fiscalYear)
    .eq("week_no", week.weekNo)
    .eq("collected_on", collectedOn);
  if (error) throw new Error(`임시 보관 목록 읽기 실패: ${error.message}`);
  return (data as { office: string }[]).map((row) => row.office);
}

/** 주간 기록 전체 (회계연도·주차 순) */
export async function listSnapshots(): Promise<WeeklySnapshot[]> {
  const { data, error } = await db()
    .from("weekly_snapshots")
    .select("fiscal_year, week_no, week_start, status, last_attempt_at, succeeded_at, attempts, item_count")
    .order("fiscal_year")
    .order("week_no");
  if (error) throw new Error(`주간 기록 읽기 실패: ${error.message}`);
  return (data as SnapshotRow[]).map(toSnapshot);
}

/** 한 주(회계연도·주차)의 물건 목록. 기록이 없으면 빈 목록 */
export async function getItems(fiscalYear: number, weekNo: number): Promise<AuctionItem[]> {
  const { data: snapshot, error: snapshotError } = await db()
    .from("weekly_snapshots")
    .select("id")
    .eq("fiscal_year", fiscalYear)
    .eq("week_no", weekNo)
    .maybeSingle();
  if (snapshotError) throw new Error(`주간 기록 찾기 실패: ${snapshotError.message}`);
  if (!snapshot) return [];

  // 한 주에 수천 건이라 1,000줄씩 나눠 읽는다
  const items: AuctionItem[] = [];
  for (let from = 0; ; from += READ_PAGE) {
    const { data, error } = await db()
      .from("snapshot_items")
      .select("item_no, region_office, category, fail_count, collected_on")
      .eq("snapshot_id", snapshot.id)
      .order("item_no")
      .range(from, from + READ_PAGE - 1);
    if (error) throw new Error(`물건 읽기 실패: ${error.message}`);
    const rows = data as ItemRow[];
    for (const row of rows) {
      items.push({
        itemNo: row.item_no,
        regionOffice: row.region_office,
        category: row.category,
        failCount: row.fail_count,
        collectedOn: row.collected_on,
      });
    }
    if (rows.length < READ_PAGE) break;
  }
  return items;
}
