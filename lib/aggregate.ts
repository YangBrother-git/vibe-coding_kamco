// 집계 계산 (DESIGN 3.2, 9장 ③·⑤ / PRD 5장 must ①)
// 물건 목록을 받아 "지역본부 × 용도 대분류 × 유찰 6칸" 건수와 지역별 유찰 현황을 센다.
// 저장소·화면과 상관없는 순수 계산이라, 같은 물건 목록이면 언제나 같은 결과를 낸다
// (성공 기준 ② "원본과 20건 100% 일치"를 확인하기 쉽게 하기 위해 분리).
//
// 전제: 같은 주에 같은 물건번호는 이미 하나만 들어온다 (수집 단계에서 정리, DESIGN 4.1).

import { KNOWN_CATEGORIES, KNOWN_REGION_OFFICES, OTHER } from "./known-values";
import { FAIL_BUCKETS, type AuctionItem, type FailBucket } from "./types";

/** 지역 선택 메뉴 맨 위에 두는 전국 합계 이름 */
export const NATIONAL = "전국 합계";

/** 히트맵 한 줄 = 용도 대분류 하나, 유찰 0~5회 이상 6칸의 건수 */
export type HeatmapRow = {
  category: string;
  /** FAIL_BUCKETS 순서(0회, 1회, … 5회 이상)의 건수 6개 */
  counts: number[];
};

/** 한 지역(또는 전국)의 히트맵 표 */
export type HeatmapTable = {
  /** 지역본부 이름, 전국이면 NATIONAL */
  region: string;
  /** 위에서 아래 순서: 알려진 용도 대분류 → "기타"(해당 물건이 있을 때만) */
  rows: HeatmapRow[];
  /** 표에 들어간 전체 물건 수 */
  total: number;
};

/** 지역 선택 메뉴 한 줄 */
export type RegionSummary = {
  /** 지역본부 이름, 전국이면 NATIONAL */
  region: string;
  /** 전체 물건 수 */
  total: number;
  /** 유찰 1회 이상 물건 수 */
  failedCount: number;
  /** 유찰 1회 이상 ÷ 전체 (0~1). 물건이 없으면 null */
  failedRatio: number | null;
};

const knownRegions = new Set(KNOWN_REGION_OFFICES);
const knownCategories = new Set(KNOWN_CATEGORIES);

/** 지역본부 값 정리: 비어 있거나 목록에 없으면 "기타" */
export function normalizeRegion(value: string | null): string {
  const v = value?.trim() ?? "";
  return knownRegions.has(v) ? v : OTHER;
}

/** 용도 대분류 값 정리: 비어 있거나 목록에 없으면 "기타" */
export function normalizeCategory(value: string | null): string {
  const v = value?.trim() ?? "";
  return knownCategories.has(v) ? v : OTHER;
}

/** 유찰 횟수 → 칸 (5회 이상은 모두 5) */
export function toFailBucket(failCount: number): FailBucket {
  // 원본 값을 짐작해 고치지 않는다. 0 이상의 정수가 아니면 수집 단계 오류로 본다.
  if (!Number.isInteger(failCount) || failCount < 0) {
    throw new Error(`유찰 횟수가 올바르지 않습니다: ${failCount}`);
  }
  return Math.min(failCount, 5) as FailBucket;
}

/**
 * 히트맵 표 만들기.
 * region을 주면 그 지역본부만, 주지 않으면(또는 NATIONAL이면) 전국 합계.
 * 알려진 용도 대분류는 0건이어도 줄을 만들어 표 모양이 주마다 바뀌지 않게 한다.
 */
export function buildHeatmap(items: readonly AuctionItem[], region: string = NATIONAL): HeatmapTable {
  const rows = new Map<string, number[]>();
  for (const category of KNOWN_CATEGORIES) {
    rows.set(category, FAIL_BUCKETS.map(() => 0));
  }

  let total = 0;
  for (const item of items) {
    if (region !== NATIONAL && normalizeRegion(item.regionOffice) !== region) continue;
    const category = normalizeCategory(item.category);
    if (!rows.has(category)) rows.set(category, FAIL_BUCKETS.map(() => 0)); // "기타" 줄
    rows.get(category)![toFailBucket(item.failCount)] += 1;
    total += 1;
  }

  return {
    region,
    rows: [...rows].map(([category, counts]) => ({ category, counts })),
    total,
  };
}

function summarize(region: string, items: readonly AuctionItem[]): RegionSummary {
  const failedCount = items.filter((item) => toFailBucket(item.failCount) >= 1).length;
  return {
    region,
    total: items.length,
    failedCount,
    failedRatio: items.length === 0 ? null : failedCount / items.length,
  };
}

/**
 * 지역 선택 메뉴 목록.
 * 순서: 전국 합계(맨 위) → 지역본부(유찰 1회 이상 건수가 많은 순, 같으면 가나다순) → "기타"(맨 아래, 해당 물건이 있을 때만).
 * 알려진 지역본부는 물건이 없어도 0건으로 보여 준다.
 */
export function summarizeRegions(items: readonly AuctionItem[]): RegionSummary[] {
  const byRegion = new Map<string, AuctionItem[]>();
  for (const region of KNOWN_REGION_OFFICES) byRegion.set(region, []);
  for (const item of items) {
    const region = normalizeRegion(item.regionOffice);
    if (!byRegion.has(region)) byRegion.set(region, []); // "기타" 지역
    byRegion.get(region)!.push(item);
  }

  const offices = KNOWN_REGION_OFFICES.map((region) => summarize(region, byRegion.get(region)!)).sort(
    (a, b) => b.failedCount - a.failedCount || a.region.localeCompare(b.region, "ko"),
  );
  const other = byRegion.get(OTHER);

  return [
    summarize(NATIONAL, items),
    ...offices,
    ...(other && other.length > 0 ? [summarize(OTHER, other)] : []),
  ];
}
