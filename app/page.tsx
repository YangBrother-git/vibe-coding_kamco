// 히트맵 화면 (DESIGN 2.1)
// 지금은 가짜 데이터의 가장 최근 성공 주를 전국 합계 표로 보여 준다.
// 저장소 연결(PLAN 작업 19) 뒤에는 저장된 데이터를 읽는다.

import { HeatmapLegend } from "@/components/heatmap-legend";
import { HeatmapTable } from "@/components/heatmap-table";
import { NATIONAL, buildHeatmap } from "@/lib/aggregate";
import { MOCK_SNAPSHOTS, getMockItems } from "@/lib/mock-data";
import { fiscalWeekFromNumber } from "@/lib/week";

/** `2026-10-19` → `10.19` */
function monthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

export default function Home() {
  // 기본 화면 = 가장 최근에 성공한 주 (실패·재시도 중인 주는 건너뜀)
  const latest = MOCK_SNAPSHOTS.filter((s) => s.status === "success").at(-1);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">온비드 압류재산 매각현황 히트맵</h1>

      {latest ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            {NATIONAL} · {latest.fiscalYear}년 {latest.weekNo}주차{" "}
            <span className="text-zinc-500">
              ({monthDay(latest.weekStart)}~
              {monthDay(fiscalWeekFromNumber(latest.fiscalYear, latest.weekNo).weekEnd)})
            </span>
          </h2>
          <HeatmapTable table={buildHeatmap(getMockItems(latest.fiscalYear, latest.weekNo))} />
          <HeatmapLegend />
        </section>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">이번 회계연도에는 아직 수집된 주가 없습니다</p>
      )}
    </main>
  );
}
