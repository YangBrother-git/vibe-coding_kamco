// 히트맵 화면 (DESIGN 2.1)
// 지금은 가짜 데이터를 보여 준다. 저장소 연결(PLAN 작업 19) 뒤에는 저장된 데이터를 읽는다.
// 화면 상태는 주소에 담는다: ?fy=회계연도&region=지역본부&week=주차
// (없으면 올해 · 전국 합계 · 그 회계연도의 가장 최근 성공 주)

import { connection } from "next/server";
import { Suspense } from "react";
import { FiscalYearSelect } from "@/components/fiscal-year-select";
import { HeatmapLegend } from "@/components/heatmap-legend";
import { HeatmapTable } from "@/components/heatmap-table";
import { CollectFailedBanner } from "@/components/collect-failed-banner";
import { RegionList } from "@/components/region-list";
import { WeekSlider } from "@/components/week-slider";
import { NATIONAL, buildHeatmap, summarizeRegions } from "@/lib/aggregate";
import { failedWeekToShow, formatKstDateTime, latestSuccess } from "@/lib/collect-status";
import { MOCK_SNAPSHOTS, getMockItems } from "@/lib/mock-data";
import { currentFiscalWeek, fiscalWeekFromNumber } from "@/lib/week";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type View = { fiscalYear: number; region: string; week: number | null };

/** `2026-10-19` → `10.19` */
function monthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

/** `43주차 (10.19~10.25)` */
function weekLabel(fiscalYear: number, weekNo: number): string {
  const { weekStart, weekEnd } = fiscalWeekFromNumber(fiscalYear, weekNo);
  return `${weekNo}주차 (${monthDay(weekStart)}~${monthDay(weekEnd)})`;
}

// 주소(searchParams)와 지금 시각을 읽는 부분. Cache Components 규칙상 <Suspense> 안에서 읽는다.
async function HeatmapView({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  // "올해"는 요청이 들어온 시각으로 정해야 하므로, 미리 그리기를 여기서 멈춘다
  await connection();
  const now = new Date();
  const currentYear = currentFiscalWeek(now).fiscalYear;
  const failedWeek = failedWeekToShow(MOCK_SNAPSHOTS, now);
  const lastSuccess = latestSuccess(MOCK_SNAPSHOTS);

  // 성공한 주만 화면에 쓴다 (실패·재시도 중·수집 안 된 주는 건너뜀)
  const successWeeks = MOCK_SNAPSHOTS.filter((s) => s.status === "success");

  // 회계연도 메뉴 = 데이터가 있는 연도 + 올해 (최근 연도가 위)
  const years = [...new Set([currentYear, ...successWeeks.map((s) => s.fiscalYear)])].sort((a, b) => b - a);
  const requestedYear = Number(params.fy);
  const fiscalYear = Number.isInteger(requestedYear) && requestedYear > 2000 ? requestedYear : currentYear;
  const weeks = successWeeks.filter((s) => s.fiscalYear === fiscalYear);
  const latestWeek = weeks.at(-1)?.weekNo ?? null;

  /** 화면 주소 만들기. 기본값(올해, 전국 합계, 가장 최근 성공 주)은 주소에서 뺀다. */
  const viewHref = (view: View) => {
    const query = new URLSearchParams();
    if (view.fiscalYear !== currentYear) query.set("fy", String(view.fiscalYear));
    if (view.region !== NATIONAL) query.set("region", view.region);
    if (view.week !== null && view.week !== latestWeek) query.set("week", String(view.week));
    const text = query.toString();
    return text ? `/?${text}` : "/";
  };

  const requestedRegion = typeof params.region === "string" ? params.region : NATIONAL;
  const yearOptions = years.map((year) => ({
    year,
    // 연도를 바꾸면 주차는 그 연도의 가장 최근 성공 주로 (지역은 유지)
    href: viewHref({ fiscalYear: year, region: requestedRegion, week: null }),
  }));
  // 메뉴에 없는 연도를 주소로 열었을 때도 select가 그 연도를 보여 주게 한다
  if (!years.includes(fiscalYear)) {
    yearOptions.push({ year: fiscalYear, href: viewHref({ fiscalYear, region: requestedRegion, week: null }) });
  }

  const toolbar = (
    <>
      {failedWeek ? (
        <CollectFailedBanner weekLabel={`${failedWeek.fiscalYear}년 ${weekLabel(failedWeek.fiscalYear, failedWeek.weekNo)}`} />
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          마지막 성공 수집:{" "}
          <span className="tabular-nums text-foreground">
            {lastSuccess?.succeededAt ? formatKstDateTime(lastSuccess.succeededAt) : "아직 없음"}
          </span>
        </p>
        <FiscalYearSelect options={yearOptions} selected={fiscalYear} currentYear={currentYear} />
      </div>
    </>
  );

  // 고른 회계연도에 성공한 주가 하나도 없을 때
  if (latestWeek === null) {
    return (
      <div className="flex flex-col gap-6">
        {toolbar}
        <p className="rounded border border-dashed border-zinc-300 px-4 py-10 text-center text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          {fiscalYear === currentYear ? "이번 회계연도에는 아직 수집된 주가 없습니다" : "비교할 지난해 데이터 없음"}
        </p>
      </div>
    );
  }

  // 주소의 주차가 이 회계연도의 성공한 주가 아니면 가장 최근 성공 주로 연다
  const week = weeks.some((s) => s.weekNo === Number(params.week)) ? Number(params.week) : latestWeek;
  const items = getMockItems(fiscalYear, week);
  const summaries = summarizeRegions(items);
  // 주소의 지역이 목록에 없으면 전국 합계로 연다
  const region = summaries.some((s) => s.region === requestedRegion) ? requestedRegion : NATIONAL;

  const regions = summaries.map((s) => ({ ...s, href: viewHref({ fiscalYear, region: s.region, week }) }));
  const weekOptions = weeks.map((s) => ({
    weekNo: s.weekNo,
    label: weekLabel(fiscalYear, s.weekNo),
    href: viewHref({ fiscalYear, region, week: s.weekNo }),
  }));

  return (
    <div className="flex flex-col gap-6">
      {toolbar}
      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <RegionList regions={regions} selected={region} />
        <section className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-medium">
            {region} · {fiscalYear}년 <span className="text-zinc-500">{weekLabel(fiscalYear, week)}</span>
          </h2>
          <HeatmapTable table={buildHeatmap(items, region)} />
          <HeatmapLegend />
          <WeekSlider key={`${fiscalYear}-${week}`} weeks={weekOptions} selected={week} />
        </section>
      </div>
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
