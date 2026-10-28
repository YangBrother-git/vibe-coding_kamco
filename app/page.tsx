// 히트맵 화면 (DESIGN 2.1)
// 지금은 가짜 데이터의 가장 최근 성공 주를 보여 준다.
// 저장소 연결(PLAN 작업 19) 뒤에는 저장된 데이터를 읽는다.
// 화면 상태는 주소에 담는다: ?region=지역본부 (없으면 전국 합계)

import { Suspense } from "react";
import { HeatmapLegend } from "@/components/heatmap-legend";
import { HeatmapTable } from "@/components/heatmap-table";
import { RegionList } from "@/components/region-list";
import { NATIONAL, buildHeatmap, summarizeRegions } from "@/lib/aggregate";
import { MOCK_SNAPSHOTS, getMockItems } from "@/lib/mock-data";
import { fiscalWeekFromNumber } from "@/lib/week";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** `2026-10-19` → `10.19` */
function monthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

/** 지역을 고르는 주소. 전국 합계는 주소에서 region을 뺀다. */
function regionHref(region: string): string {
  return region === NATIONAL ? "/" : `/?${new URLSearchParams({ region })}`;
}

// 주소(searchParams)를 읽는 부분. Cache Components 규칙상 <Suspense> 안에서 읽는다.
async function HeatmapView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // 기본 화면 = 가장 최근에 성공한 주 (실패·재시도 중인 주는 건너뜀)
  const latest = MOCK_SNAPSHOTS.filter((s) => s.status === "success").at(-1);
  if (!latest) {
    return <p className="text-zinc-600 dark:text-zinc-400">이번 회계연도에는 아직 수집된 주가 없습니다</p>;
  }

  const items = getMockItems(latest.fiscalYear, latest.weekNo);
  const regions = summarizeRegions(items).map((summary) => ({ ...summary, href: regionHref(summary.region) }));

  // 주소의 지역이 목록에 없으면 전국 합계로 연다
  const requested = typeof params.region === "string" ? params.region : NATIONAL;
  const selected = regions.some((r) => r.region === requested) ? requested : NATIONAL;
  const { weekEnd } = fiscalWeekFromNumber(latest.fiscalYear, latest.weekNo);

  return (
    <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
      <RegionList regions={regions} selected={selected} />
      <section className="flex min-w-0 flex-col gap-3">
        <h2 className="text-lg font-medium">
          {selected} · {latest.fiscalYear}년 {latest.weekNo}주차{" "}
          <span className="text-zinc-500">
            ({monthDay(latest.weekStart)}~{monthDay(weekEnd)})
          </span>
        </h2>
        <HeatmapTable table={buildHeatmap(items, selected)} />
        <HeatmapLegend />
      </section>
    </div>
  );
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">온비드 압류재산 매각현황 히트맵</h1>
      <Suspense fallback={<p className="text-zinc-500">불러오는 중…</p>}>
        <HeatmapView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
